import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Build stages from environment variables
const TARGET_VUS = __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS, 10) : 20;
const WARMUP_DURATION = __ENV.WARMUP_DURATION || '1m';
const LOAD_DURATION = __ENV.LOAD_DURATION || '5m';
const COOLDOWN_DURATION = __ENV.COOLDOWN_DURATION || '1m';

export const options = {
  stages: [
    { duration: WARMUP_DURATION, target: TARGET_VUS }, // calentamiento
    { duration: LOAD_DURATION, target: TARGET_VUS },   // carga
    { duration: COOLDOWN_DURATION, target: 0 },        // enfriamiento
  ],
  thresholds: {
    // El 95% de las peticiones debe durar menos de 1.2s
    http_req_duration: ['p(95)<1200'],
    
    // Menos del 1% de las peticiones HTTP deben fallar (códigos 4xx o 5xx)
    http_req_failed: ['rate<0.01'], 
    
    // Más del 95% de los check() dentro de los flujos deben dar positivo
    checks: ['rate>0.95'],
  },
};

const externalBaseUrl = __ENV.externalBaseUrl || 'http://localhost:3000';
const crudBaseUrl = __ENV.crudBaseUrl || 'http://localhost:3001';
const businessBaseUrl = __ENV.businessBaseUrl || 'http://localhost:3002';

// Credentials
const patientEmail = __ENV.patientEmail || '';
const patientPassword = __ENV.patientPassword || '';
const doctorEmail = __ENV.doctorEmail || '';
const doctorPassword = __ENV.doctorPassword || '';
const adminEmail = __ENV.adminEmail || '';
const adminPassword = __ENV.adminPassword || '';

function login(email, password) {
  const url = `${externalBaseUrl}/api/v1/auth/login`;
  const res = http.post(url, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  let token = null;
  try {
    const json = res.json();
    token = json.token || json.data?.token || json.accessToken || json.data?.accessToken || json.result?.token || json.user?.token;
  } catch (e) {
    // ignore
  }
  return { res, token };
}

export function setup() {
  const out = {};
  if (patientEmail && patientPassword) {
    const r = login(patientEmail, patientPassword);
    out.patientToken = r.token;
  }
  if (doctorEmail && doctorPassword) {
    const r = login(doctorEmail, doctorPassword);
    out.doctorToken = r.token;
  }
  if (adminEmail && adminPassword) {
    const r = login(adminEmail, adminPassword);
    out.adminToken = r.token;
  }
  return out;
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function (data) {
  const patientToken = data.patientToken;
  const doctorToken = data.doctorToken;
  const adminToken = data.adminToken;

  // Choose which flows to run: comma-separated in FLOWS env var (default: all)
  const flows = (__ENV.FLOWS || 'patient,doctor,admin').split(',').map(s => s.trim());

  if (flows.includes('patient')) {
    group('Ruta 1 - Paciente agenda cita', function () {
      // 03 - Obtener mi perfil de paciente
      if (patientToken) {
        const me = http.get(`${crudBaseUrl}/api/v1/patients/me`, { headers: { Authorization: `Bearer ${patientToken}` } });
        check(me, { 'patients/me 200': r => r.status === 200 || r.status === 204 });
      }

      // 04 - Listar especialidades
      const sp = http.get(`${crudBaseUrl}/api/v1/specialties/`);
      check(sp, { 'specialties 200': r => r.status === 200 });
      let specialtyId = null;
      try { const js = sp.json(); const arr = js.data || js.specialties || js; if (Array.isArray(arr) && arr.length) specialtyId = arr[0].id; } catch (e) {}

      // 05 - Listar doctores activos
      const dr = http.get(`${crudBaseUrl}/api/v1/doctors/`);
      check(dr, { 'doctors 200': r => r.status === 200 });
      let doctorId = null;
      try { const js = dr.json(); const arr = js.data || js.doctors || js; if (Array.isArray(arr) && arr.length) doctorId = arr[0].id; } catch (e) {}

      // 06 - Consultar horarios disponibles por fecha
      const scheduledDate = __ENV.scheduledDate || todayPlus(1);
      let scheduledTime = __ENV.scheduledTime || null;
      let scheduledStart = __ENV.scheduledStart || null;

      if (doctorId) {
        const av = http.get(`${businessBaseUrl}/api/v1/availability/doctor/${doctorId}/date/${scheduledDate}`);
        check(av, { 'availability 200': r => r.status === 200 || r.status === 204 || r.status === 400 || r.status === 409 });
        try {
          const js = av.json();
          const possible = js.data?.availableSlots || js.data?.slots || js.slots || js.data || [];
          if (Array.isArray(possible) && possible.length) {
            const s = typeof possible[0] === 'string' ? possible[0] : (possible[0].time || possible[0].start_time || possible[0].hour || null);
            if (s) scheduledTime = s;
            if (!scheduledStart && scheduledTime) scheduledStart = `${scheduledDate}T${scheduledTime}:00-05:00`;
          }
        } catch (e) {}
      }

      // 07 - Verificar disponibilidad de horario
      if (doctorId && scheduledTime) {
        const chk = http.post(`${businessBaseUrl}/api/v1/availability/check`, JSON.stringify({ doctorId, date: scheduledDate, time: scheduledTime }), { headers: { 'Content-Type': 'application/json' } });
        check(chk, { 'availability/check 200': r => r.status === 200 || r.status === 204 || r.status === 409 || r.status === 400 });
      }

      // 08 - Agendar una cita
      let appointmentId = null;
      if (patientToken && doctorId && scheduledStart) {
        const book = http.post(`${businessBaseUrl}/api/v1/scheduling/book`, JSON.stringify({ doctor_id: doctorId, scheduled_start: scheduledStart, reason: 'Prueba k6' }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` } });
        check(book, { 'scheduling/book 200': r => r.status === 200 || r.status === 201 });
        try { const js = book.json(); const ap = js.data?.appointment || js.appointment || js.data || js; appointmentId = ap?.id || js.appointment_id || js.data?.appointment_id; } catch (e) {}
      }

      // 09 - Listar mis citas como paciente
      if (patientToken) {
        const list = http.get(`${crudBaseUrl}/api/v1/appointments/patient`, { headers: { Authorization: `Bearer ${patientToken}` } });
        check(list, { 'appointments/patient 200': r => r.status === 200 });
        try { const js = list.json(); const arr = js.data || js.appointments || js; if (!appointmentId && Array.isArray(arr) && arr.length) appointmentId = arr[0].id; } catch (e) {}
      }

      // 10 - Obtener cita por ID
      if (patientToken && appointmentId) {
        const getA = http.get(`${crudBaseUrl}/api/v1/appointments/${appointmentId}`, { headers: { Authorization: `Bearer ${patientToken}` } });
        check(getA, { 'appointments/:id 200': r => r.status === 200 });
      }
      // 11 - PASO DE LIMPIEZA (DELETE / CANCEL)
  if (patientToken && appointmentId) {
    // Opción A: Borrado físico si tu API lo permite
    const delRes = http.del(
      `${crudBaseUrl}/api/v1/appointments/${appointmentId}`,
      null,
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );

    /* 
    // Opción B: Cancelación lógica si tu API no permite DELETE directo
    const delRes = http.post(
      `${businessBaseUrl}/api/v1/scheduling/cancel/${appointmentId}`,
      JSON.stringify({ reason: 'Cancelación por prueba k6' }),
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` } }
    );
    */

    check(delRes, {
      'appointment deleted/cancelled 200': r => r.status === 200 || r.status === 204
    });
  }
    });
  }

  if (flows.includes('doctor')) {
    group('Ruta 2 - Doctor consulta citas', function () {
      if (doctorToken) {
        http.get(`${crudBaseUrl}/api/v1/doctors/me`, { headers: { Authorization: `Bearer ${doctorToken}` } });
        const list = http.get(`${crudBaseUrl}/api/v1/appointments/doctor`, { headers: { Authorization: `Bearer ${doctorToken}` } });
        check(list, { 'appointments/doctor 200': r => r.status === 200 });
        http.get(`${crudBaseUrl}/api/v1/doctors/my-patients`, { headers: { Authorization: `Bearer ${doctorToken}` } });
      }
    });
  }

  if (flows.includes('admin')) {
    group('Ruta 3 - Admin gestiona especialidades', function () {
      if (adminToken) {
        const nameSuffix = Date.now().toString().slice(-6);
        const createdName = `Especialidad k6 ${nameSuffix}`;
        // 05 - Crear especialidad de prueba
        const create = http.post(`${crudBaseUrl}/api/v1/specialties/`, JSON.stringify({ name: createdName, description: 'Creada por k6', consultation_fee: 10 }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } });
        check(create, { 'specialties create 200': r => r.status === 200 || r.status === 201 });
        let createdId = null;
        try { const js = create.json(); const sp = js.data?.specialty || js.specialty || js.data || js; createdId = sp?.id || js.specialty_id || js.data?.specialty_id; } catch (e) {}

        if (createdId) {
          http.get(`${crudBaseUrl}/api/v1/specialties/${createdId}`);
          http.put(`${crudBaseUrl}/api/v1/specialties/${createdId}`, JSON.stringify({ name: `${createdName} updated`, description: 'Actualizada por k6', consultation_fee: 12 }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } });
          http.del(`${crudBaseUrl}/api/v1/specialties/${createdId}`, null, { headers: { Authorization: `Bearer ${adminToken}` } });
        }
      }
    });
  }

  // small sleep so VUs do not hammer too tightly in tight loops
  sleep(Number(__ENV.ITERATION_SLEEP_MS || 1000) / 1000);
}
