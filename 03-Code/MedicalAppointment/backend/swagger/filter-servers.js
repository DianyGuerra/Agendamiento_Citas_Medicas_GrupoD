const fs = require('fs');
const path = require('path');

const swaggerDir = __dirname;
const backendRoot = path.resolve(__dirname, '..');

const inputPath = path.join(swaggerDir, 'swagger-output.json');
const swaggerOutputPath = path.join(swaggerDir, 'swagger-all-output.json');

const postmanDir = path.join(backendRoot, 'postman');
const collectionOutputPath = path.join(postmanDir, 'MedicalAppointment_TodosEndpoints.postman_collection.json');
const environmentOutputPath = path.join(postmanDir, 'MedicalAppointment_TodosEndpoints.postman_environment.json');

const swagger = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const httpMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace'
]);

const forbiddenHeaderParams = new Set([
  'origin',
  'referer',
  'host',
  'user-agent',
  'content-length',
  'connection',
  'authorization'
]);

const moduleConfig = [
  // External API
  { name: 'Auth', prefix: '/api/v1/auth', server: '{{externalBaseUrl}}', description: 'External API' },

  // Business API
  { name: 'Availability', prefix: '/api/v1/availability', server: '{{businessBaseUrl}}', description: 'Business API' },
  { name: 'Scheduling', prefix: '/api/v1/scheduling', server: '{{businessBaseUrl}}', description: 'Business API' },

  // CRUD API
  { name: 'Users', prefix: '/api/v1/users', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Patients', prefix: '/api/v1/patients', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Doctors', prefix: '/api/v1/doctors', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Appointments', prefix: '/api/v1/appointments', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Specialties', prefix: '/api/v1/specialties', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Schedules', prefix: '/api/v1/schedules', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Medical Records', prefix: '/api/v1/medical-records', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Prescriptions', prefix: '/api/v1/prescriptions', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Prescription Renewals', prefix: '/api/v1/prescription-renewals', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Billings', prefix: '/api/v1/billings', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Billing Items', prefix: '/api/v1/billing-items', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Consultation Rooms', prefix: '/api/v1/consultation-rooms', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Consultation Notes', prefix: '/api/v1/consultation-notes', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Doctor Ratings', prefix: '/api/v1/doctor-ratings', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Waiting List', prefix: '/api/v1/waiting-list', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Medical Services', prefix: '/api/v1/medical-services', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Insurance Providers', prefix: '/api/v1/insurance-providers', server: '{{crudBaseUrl}}', description: 'CRUD API' },
  { name: 'Security', prefix: '/api/v1/security', server: '{{crudBaseUrl}}', description: 'CRUD API' }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeKey(value) {
  return String(value || '')
    .replace(/[-_]/g, '')
    .toLowerCase();
}

function getModuleConfig(routePath) {
  if (routePath === '/health') {
    return { name: 'Health', prefix: '/health', server: '{{crudBaseUrl}}', description: 'Health' };
  }

  return moduleConfig.find(config =>
    routePath === config.prefix ||
    routePath.startsWith(config.prefix + '/') ||
    routePath.startsWith(config.prefix + '{')
  ) || {
    name: 'Otros',
    prefix: '/',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  };
}

function inferIdVariableByRoute(routePath) {
  if (routePath.includes('/doctors')) return 'doctorId';
  if (routePath.includes('/patients')) return 'patientId';
  if (routePath.includes('/specialties')) return 'specialtyId';
  if (routePath.includes('/appointments')) return 'appointmentId';
  if (routePath.includes('/users')) return 'userId';
  if (routePath.includes('/schedules')) return 'scheduleId';
  if (routePath.includes('/medical-records')) return 'medicalRecordId';
  if (routePath.includes('/prescriptions')) return 'prescriptionId';
  if (routePath.includes('/billings')) return 'billingId';
  if (routePath.includes('/billing-items')) return 'billingItemId';
  if (routePath.includes('/consultation-rooms')) return 'roomId';
  if (routePath.includes('/consultation-notes')) return 'consultationNoteId';
  if (routePath.includes('/doctor-ratings')) return 'doctorRatingId';
  if (routePath.includes('/waiting-list')) return 'waitingListId';
  if (routePath.includes('/medical-services')) return 'medicalServiceId';
  if (routePath.includes('/insurance-providers')) return 'insuranceProviderId';
  return 'id';
}

function normalizeVariableName(name, routePath = '') {
  const normalized = normalizeKey(name);

  const map = {
    id: inferIdVariableByRoute(routePath),

    user: 'userId',
    userid: 'userId',
    usuario: 'userId',
    usuarioid: 'userId',

    patient: 'patientId',
    patientid: 'patientId',
    paciente: 'patientId',
    pacienteid: 'patientId',
    patientuserid: 'patientUserId',

    doctor: 'doctorId',
    doctorid: 'doctorId',

    specialty: 'specialtyId',
    specialtyid: 'specialtyId',
    speciality: 'specialtyId',
    specialityid: 'specialtyId',

    appointment: 'appointmentId',
    appointmentid: 'appointmentId',
    cita: 'appointmentId',
    citaid: 'appointmentId',

    schedule: 'scheduleId',
    scheduleid: 'scheduleId',

    room: 'roomId',
    roomid: 'roomId',
    roomidid: 'roomId',
    consultationroom: 'roomId',
    consultationroomid: 'roomId',

    medicalrecord: 'medicalRecordId',
    medicalrecordid: 'medicalRecordId',

    prescription: 'prescriptionId',
    prescriptionid: 'prescriptionId',

    billing: 'billingId',
    billingid: 'billingId',

    billingitem: 'billingItemId',
    billingitemid: 'billingItemId',

    insuranceprovider: 'insuranceProviderId',
    insuranceproviderid: 'insuranceProviderId',

    date: 'scheduledDate',
    fecha: 'scheduledDate',
    time: 'scheduledTime',
    hora: 'scheduledTime',
    scheduleddate: 'scheduledDate',
    scheduledtime: 'scheduledTime',
    scheduledstart: 'scheduledStart',
    scheduled_start: 'scheduledStart',
    startdate: 'startDate',
    enddate: 'endDate',

    page: 'page',
    limit: 'limit',
    search: 'search',
    status: 'status',
    estado: 'status',
    role: 'role',
    rol: 'role',
    active: 'active',
    include_cancelled: 'includeCancelled',
    includecancelled: 'includeCancelled',
    token: 'adminToken'
  };

  return map[normalized] || String(name || 'value');
}

function replacePathParams(routePath) {
  return routePath.replace(/{([^}]+)}/g, (_, paramName) => {
    return '{{' + normalizeVariableName(paramName, routePath) + '}}';
  });
}

function cleanOperation(operation) {
  const cleaned = JSON.parse(JSON.stringify(operation || {}));

  if (Array.isArray(cleaned.parameters)) {
    cleaned.parameters = cleaned.parameters.filter(param => {
      const location = String(param.in || '').toLowerCase();
      const name = String(param.name || '').toLowerCase();
      return !(location === 'header' && forbiddenHeaderParams.has(name));
    });
  }

  return cleaned;
}

function getQueryParams(operation) {
  if (!Array.isArray(operation.parameters)) return [];

  return operation.parameters.filter(param =>
    String(param.in || '').toLowerCase() === 'query'
  );
}

function buildUrl(routePath, config, operation) {
  const pathWithVariables = replacePathParams(routePath);
  const queryParams = getQueryParams(operation);

  let raw = config.server + pathWithVariables;

  if (queryParams.length > 0) {
    const query = queryParams
      .map(param => {
        const key = param.name;
        const variableName = normalizeVariableName(param.name, routePath);
        return encodeURIComponent(key) + '={{' + variableName + '}}';
      })
      .join('&');

    raw += '?' + query;
  }

  return raw;
}

function buildPostmanUrl(rawUrl) {
  const [baseAndPath, queryString] = rawUrl.split('?');
  const match = baseAndPath.match(/^({{[^}]+}})(\/.*)?$/);

  if (!match) return { raw: rawUrl };

  const baseUrl = match[1];
  const pathPart = match[2] || '';

  const url = {
    raw: rawUrl,
    host: [baseUrl],
    path: pathPart.replace(/^\//, '').split('/').filter(Boolean)
  };

  if (queryString) {
    url.query = queryString.split('&').map(pair => {
      const [key, value] = pair.split('=');

      return {
        key: decodeURIComponent(key),
        value: decodeURIComponent(value || ''),
        disabled: false
      };
    });
  }

  return url;
}

function noAuth() {
  return { type: 'noauth' };
}

function bearerAuth(tokenVariable) {
  return {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{' + tokenVariable + '}}',
        type: 'string'
      }
    ]
  };
}

function jsonHeader() {
  return [
    {
      key: 'Content-Type',
      value: 'application/json',
      type: 'text'
    }
  ];
}

function scriptLines(script) {
  return String(script || '').trim().split('\n');
}

function testEvent(script) {
  return {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: scriptLines(script)
    }
  };
}

function prerequestEvent(script) {
  return {
    listen: 'prerequest',
    script: {
      type: 'text/javascript',
      exec: scriptLines(script)
    }
  };
}

function makeRequest({ name, method, url, auth, body, tests, prerequest, headers }) {
  const item = {
    name,
    request: {
      method: method.toUpperCase(),
      header: headers || [],
      url: buildPostmanUrl(url),
      auth: auth || noAuth()
    },
    response: []
  };

  if (body !== undefined && body !== null) {
    item.request.header = jsonHeader();
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }

  const events = [];

  if (prerequest) events.push(prerequestEvent(prerequest));
  if (tests) events.push(testEvent(tests));

  if (events.length > 0) item.event = events;

  return item;
}

const commonTests = `
pm.test("No hay error interno 500", function () {
    pm.expect(pm.response.code).to.not.equal(500);
});

pm.test("Tiempo de respuesta menor a 3000 ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test("Código HTTP controlado", function () {
    pm.expect([200, 201, 204, 302, 400, 401, 403, 404, 409, 422]).to.include(pm.response.code);
});
`;

function tokenSaveTests(tokenVariable, userIdVariable) {
  return `
${commonTests}

let json = {};
try {
    json = pm.response.json();
} catch (e) {
    json = {};
}

const token =
    json.token ||
    json.data?.token ||
    json.result?.token ||
    json.user?.token ||
    json.data?.accessToken ||
    json.accessToken ||
    json.access_token ||
    json.data?.access_token;

pm.test("Token recibido", function () {
    pm.expect(token).to.exist;
});

if (token) {
    pm.environment.set("${tokenVariable}", token);
}

const userId =
    json.user?.id ||
    json.data?.user?.id ||
    json.data?.id ||
    json.id;

if (userId) {
    pm.environment.set("${userIdVariable}", userId);
}
`;
}

function authMeTests(userIdVariable) {
  return `
${commonTests}

let json = {};
try {
    json = pm.response.json();
} catch (e) {
    json = {};
}

const user =
    json.data?.user ||
    json.data ||
    json.user ||
    json;

const userId = user?.id;

if (userId) {
    pm.environment.set("${userIdVariable}", userId);
}
`;
}

const saveIdsTests = `
${commonTests}

let json = {};
try {
    json = pm.response.json();
} catch (e) {
    json = {};
}

const data =
    json.data ||
    json.result ||
    json;

const firstItem =
    Array.isArray(data) ? data[0] :
    Array.isArray(data?.items) ? data.items[0] :
    Array.isArray(data?.rows) ? data.rows[0] :
    Array.isArray(data?.users) ? data.users[0] :
    Array.isArray(data?.patients) ? data.patients[0] :
    Array.isArray(data?.doctors) ? data.doctors[0] :
    Array.isArray(data?.specialties) ? data.specialties[0] :
    Array.isArray(data?.appointments) ? data.appointments[0] :
    Array.isArray(data?.schedules) ? data.schedules[0] :
    Array.isArray(data?.records) ? data.records[0] :
    Array.isArray(data?.prescriptions) ? data.prescriptions[0] :
    Array.isArray(data?.billings) ? data.billings[0] :
    Array.isArray(data?.rooms) ? data.rooms[0] :
    Array.isArray(data?.services) ? data.services[0] :
    Array.isArray(json.users) ? json.users[0] :
    Array.isArray(json.patients) ? json.patients[0] :
    Array.isArray(json.doctors) ? json.doctors[0] :
    Array.isArray(json.specialties) ? json.specialties[0] :
    Array.isArray(json.appointments) ? json.appointments[0] :
    data;

const requestName = pm.info.requestName.toLowerCase();

const userId =
    json.user?.id ||
    json.data?.user?.id ||
    data?.user?.id ||
    firstItem?.user_id ||
    firstItem?.userId ||
    (requestName.includes("user") ? firstItem?.id : null);

if (userId) pm.environment.set("userId", userId);

const patientId =
    json.patient?.id ||
    json.data?.patient?.id ||
    data?.patient?.id ||
    firstItem?.patient_id ||
    firstItem?.patientId ||
    (requestName.includes("patient") || requestName.includes("paciente") ? firstItem?.id : null);

if (patientId) pm.environment.set("patientId", patientId);

const patientUserId =
    json.patient?.user_id ||
    json.data?.patient?.user_id ||
    data?.patient?.user_id ||
    firstItem?.patient_user_id ||
    firstItem?.patientUserId ||
    firstItem?.user_id;

if (patientUserId && requestName.includes("patient")) {
    pm.environment.set("patientUserId", patientUserId);
}

const doctorId =
    json.doctor?.id ||
    json.data?.doctor?.id ||
    data?.doctor?.id ||
    firstItem?.doctor_id ||
    firstItem?.doctorId ||
    (requestName.includes("doctor") ? firstItem?.id : null);

if (doctorId) pm.environment.set("doctorId", doctorId);

const specialtyId =
    json.specialty?.id ||
    json.data?.specialty?.id ||
    data?.specialty?.id ||
    firstItem?.specialty_id ||
    firstItem?.specialtyId ||
    firstItem?.speciality_id ||
    firstItem?.specialityId ||
    (requestName.includes("specialt") || requestName.includes("especialidad") ? firstItem?.id : null);

if (specialtyId) pm.environment.set("specialtyId", specialtyId);

const createdSpecialtyId =
    json.specialty?.id ||
    json.data?.specialty?.id ||
    data?.specialty?.id ||
    json.specialty_id ||
    json.data?.specialty_id ||
    ((requestName.includes("crear") || requestName.includes("post")) && requestName.includes("specialt") ? firstItem?.id : null);

if (createdSpecialtyId) {
    pm.environment.set("createdSpecialtyId", createdSpecialtyId);
    pm.environment.set("specialtyId", createdSpecialtyId);
}

const appointmentId =
    json.appointment?.id ||
    json.data?.appointment?.id ||
    data?.appointment?.id ||
    firstItem?.appointment_id ||
    firstItem?.appointmentId ||
    json.appointment_id ||
    json.data?.appointment_id ||
    (requestName.includes("appointment") || requestName.includes("cita") ? firstItem?.id : null);

if (appointmentId) pm.environment.set("appointmentId", appointmentId);

const roomId =
    json.room?.id ||
    json.data?.room?.id ||
    data?.room?.id ||
    firstItem?.room_id ||
    firstItem?.roomId ||
    firstItem?.consultation_room_id ||
    firstItem?.consultationRoomId;

if (roomId) pm.environment.set("roomId", roomId);

const billingId =
    json.billing?.id ||
    json.data?.billing?.id ||
    data?.billing?.id ||
    firstItem?.billing_id ||
    firstItem?.billingId ||
    (requestName.includes("billing") || requestName.includes("factur") ? firstItem?.id : null);

if (billingId) pm.environment.set("billingId", billingId);
`;

const saveAvailableSlotTests = `
${commonTests}

let json = {};
try {
    json = pm.response.json();
} catch (e) {
    json = {};
}

const possibleSlots =
    json.data?.availableSlots ||
    json.data?.available_slots ||
    json.data?.slots ||
    json.data?.timeSlots ||
    json.data?.available_times ||
    json.data?.availableTimes ||
    json.availableSlots ||
    json.available_slots ||
    json.slots ||
    json.timeSlots ||
    json.available_times ||
    json.availableTimes ||
    json.data ||
    [];

let selectedSlot = null;

if (Array.isArray(possibleSlots) && possibleSlots.length > 0) {
    selectedSlot = possibleSlots.find(slot => {
        if (typeof slot === "string") return true;
        return slot.available !== false && slot.is_available !== false;
    });
}

if (selectedSlot) {
    let timeValue = null;
    let scheduledStart = null;

    if (typeof selectedSlot === "string") {
        timeValue = selectedSlot;
    } else {
        timeValue =
            selectedSlot.time ||
            selectedSlot.start_time ||
            selectedSlot.startTime ||
            selectedSlot.hour ||
            selectedSlot.hora;

        scheduledStart =
            selectedSlot.scheduled_start ||
            selectedSlot.scheduledStart ||
            selectedSlot.start ||
            selectedSlot.start_datetime ||
            selectedSlot.startDateTime;
    }

    if (!scheduledStart && timeValue) {
        const timezoneOffset = pm.environment.get("timezoneOffset") || "-05:00";
        scheduledStart = pm.environment.get("scheduledDate") + "T" + timeValue + ":00" + timezoneOffset;
    }

    if (timeValue) pm.environment.set("scheduledTime", timeValue);
    if (scheduledStart) pm.environment.set("scheduledStart", scheduledStart);
}

pm.test("Horario disponible encontrado o respuesta controlada", function () {
    pm.expect([200, 204, 400, 409]).to.include(pm.response.code);
});
`;

const dynamicPreRequest = `
const suffix = Date.now().toString().slice(-6);

pm.environment.set("createdSpecialtyName", "Especialidad Test " + suffix);
pm.environment.set("updatedSpecialtyName", "Especialidad Test Actualizada " + suffix);
pm.environment.set("testName", "Registro Test " + suffix);

pm.environment.set("testEmail", "test" + suffix + "@example.com");
pm.environment.set("testPatientEmail", "paciente" + suffix + "@example.com");
pm.environment.set("testDoctorEmail", "doctor" + suffix + "@example.com");
pm.environment.set("testCedula", "17" + suffix.padStart(8, "0").slice(0, 8));
pm.environment.set("testProfessionalId", "MED-" + suffix);
`;

function isHealthEndpoint(routePath) {
  return routePath === '/health';
}

function isLoginEndpoint(routePath, method) {
  return method.toLowerCase() === 'post' && /^\/api\/v1\/auth\/login\/?$/.test(routePath);
}

function isAuthMeEndpoint(routePath, method) {
  return method.toLowerCase() === 'get' && /^\/api\/v1\/auth\/me\/?$/.test(routePath);
}

function isPublicEndpoint(routePath, method) {
  const m = method.toLowerCase();
  const p = routePath.toLowerCase();

  if (p === '/health') return true;

  // Auth public
  if (p === '/api/v1/auth/google') return true;
  if (p === '/api/v1/auth/google/callback') return true;
  if (p === '/api/v1/auth/register' && m === 'post') return true;
  if (p === '/api/v1/auth/login' && m === 'post') return true;
  if (p === '/api/v1/auth/password-reset/request' && m === 'post') return true;
  if (p === '/api/v1/auth/password-reset/confirm' && m === 'post') return true;
  if (p === '/api/v1/auth/refresh-token' && m === 'post') return true;

  // Specialties public GET
  if (p === '/api/v1/specialties/' && m === 'get') return true;
  if (p === '/api/v1/specialties' && m === 'get') return true;
  if (p === '/api/v1/specialties/stats' && m === 'get') return true;
  if (/^\/api\/v1\/specialties\/\{[^}]+\}\/?$/.test(p) && m === 'get') return true;

  // Doctors public GET
  if ((p === '/api/v1/doctors/' || p === '/api/v1/doctors') && m === 'get') return true;
  if (/^\/api\/v1\/doctors\/specialty\/\{[^}]+\}\/?$/.test(p) && m === 'get') return true;
  if (/^\/api\/v1\/doctors\/\{[^}]+\}\/?$/.test(p) && m === 'get') return true;

  // Availability public
  if (p.startsWith('/api/v1/availability')) return true;

  // Public scheduling confirmation
  if (/^\/api\/v1\/scheduling\/confirm-public\/\{[^}]+\}\/?$/.test(p) && m === 'post') return true;

  return false;
}

function inferTokenVariable(routePath, method) {
  const p = routePath.toLowerCase();
  const m = method.toLowerCase();

  if (isPublicEndpoint(routePath, method)) return null;

  // Auth protected
  if (p === '/api/v1/auth/me') return 'adminToken';
  if (p === '/api/v1/auth/change-password') return 'adminToken';
  if (p === '/api/v1/auth/logout') return 'adminToken';

  // Users
  if (p.startsWith('/api/v1/users')) return 'adminToken';

  // Patients
  if (p === '/api/v1/patients/me') return 'patientToken';
  if (p === '/api/v1/patients/me/' || p.includes('/patients/me')) return 'patientToken';
  if (p.startsWith('/api/v1/patients')) return 'adminToken';

  // Doctors
  if (p.includes('/doctors/me') || p.includes('/doctors/my-patients')) return 'doctorToken';
  if (p.startsWith('/api/v1/doctors')) return 'adminToken';

  // Appointments
  if (p === '/api/v1/appointments/patient') return 'patientToken';
  if (p.includes('/appointments/patient')) return 'patientToken';

  if (p === '/api/v1/appointments/doctor') return 'doctorToken';
  if (p.includes('/appointments/doctor')) return 'doctorToken';
  if (p.includes('/appointments/by-patient')) return 'doctorToken';

  if ((p === '/api/v1/appointments/' || p === '/api/v1/appointments') && m === 'post') {
    return 'patientToken';
  }

  if (p.startsWith('/api/v1/appointments')) return 'adminToken';

  // Scheduling
  if (p === '/api/v1/scheduling/book') return 'patientToken';
  if (p.includes('/scheduling/book')) return 'patientToken';
  if (p.includes('/scheduling/reschedule')) return 'patientToken';
  if (p.includes('/scheduling/cancel')) return 'patientToken';

  if (p.includes('/scheduling/start')) return 'doctorToken';
  if (p.includes('/scheduling/complete')) return 'doctorToken';
  if (p.includes('/scheduling/confirm')) return 'doctorToken';
  if (p.includes('/scheduling/no-show')) return 'doctorToken';
  if (p.includes('/scheduling/statistics/doctor')) return 'doctorToken';

  if (p.includes('/scheduling/cleanup-past')) return 'adminToken';
  if (p.startsWith('/api/v1/scheduling')) return 'adminToken';

  // Specialties protected write operations
  if (p.startsWith('/api/v1/specialties') && ['post', 'put', 'patch', 'delete'].includes(m)) {
    return 'adminToken';
  }

  // CRUD modules usually protected
  if (
    p.startsWith('/api/v1/schedules') ||
    p.startsWith('/api/v1/medical-records') ||
    p.startsWith('/api/v1/prescriptions') ||
    p.startsWith('/api/v1/prescription-renewals') ||
    p.startsWith('/api/v1/billings') ||
    p.startsWith('/api/v1/billing-items') ||
    p.startsWith('/api/v1/consultation-rooms') ||
    p.startsWith('/api/v1/consultation-notes') ||
    p.startsWith('/api/v1/doctor-ratings') ||
    p.startsWith('/api/v1/waiting-list') ||
    p.startsWith('/api/v1/medical-services') ||
    p.startsWith('/api/v1/insurance-providers') ||
    p.startsWith('/api/v1/security')
  ) {
    return 'adminToken';
  }

  if (['post', 'put', 'patch', 'delete'].includes(m)) return 'adminToken';

  return 'adminToken';
}

function resolveSchema(schema) {
  if (!schema) return null;

  if (schema.$ref) {
    const refPath = schema.$ref.replace(/^#\//, '').split('/');
    let current = swagger;

    for (const segment of refPath) current = current?.[segment];

    return current || schema;
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    return schema.allOf.reduce((acc, item) => {
      const resolved = resolveSchema(item) || {};

      return {
        ...acc,
        ...resolved,
        properties: {
          ...(acc.properties || {}),
          ...(resolved.properties || {})
        },
        required: [
          ...(acc.required || []),
          ...(resolved.required || [])
        ]
      };
    }, {});
  }

  return schema;
}

function schemaType(schema) {
  if (!schema) return 'string';
  if (schema.type) return schema.type;
  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  return 'string';
}

function sampleValueForProperty(propertyName, schema, routePath, method) {
  const name = normalizeKey(propertyName);
  const p = routePath.toLowerCase();
  const m = method.toLowerCase();
  const type = schemaType(schema);

  if (name === 'doctorid' || name === 'doctor_id' || name.includes('doctorid')) return '{{doctorId}}';
  if (name === 'doctor') return '{{doctorId}}';

  if (name === 'patientid' || name === 'patient_id' || name.includes('patientid')) return '{{patientId}}';
  if (name === 'patientuserid' || name === 'patient_user_id') return '{{patientUserId}}';

  if (name === 'userid' || name === 'user_id') return '{{userId}}';

  if (name === 'specialtyid' || name === 'specialty_id' || name === 'specialityid' || name === 'speciality_id') {
    return '{{specialtyId}}';
  }

  if (name === 'appointmentid' || name === 'appointment_id') return '{{appointmentId}}';

  if (name === 'roomid' || name === 'room_id' || name === 'consultationroomid' || name === 'consultation_room_id') {
    return '{{roomId}}';
  }

  if (name === 'billingid' || name === 'billing_id') return '{{billingId}}';
  if (name === 'billingitemid' || name === 'billing_item_id') return '{{billingItemId}}';
  if (name === 'insuranceproviderid' || name === 'insurance_provider_id') return '{{insuranceProviderId}}';
  if (name === 'medicalserviceid' || name === 'medical_service_id') return '{{medicalServiceId}}';
  if (name === 'prescriptionid' || name === 'prescription_id') return '{{prescriptionId}}';

  if (name.includes('scheduledstart') || name.includes('scheduled_start')) return '{{scheduledStart}}';
  if (name === 'date' || name.includes('fecha')) return '{{scheduledDate}}';
  if (name === 'time' || name.includes('hora')) return '{{scheduledTime}}';
  if (name.includes('startdate') || name.includes('start_date')) return '{{startDate}}';
  if (name.includes('enddate') || name.includes('end_date')) return '{{endDate}}';

  if (name === 'token') {
    if (p.includes('/refresh-token')) return '{{adminToken}}';
    return '{{resetToken}}';
  }

  if (name === 'currentpassword') return '{{adminPassword}}';
  if (name === 'newpassword') return '{{newPassword}}';
  if (name === 'password' || name.includes('password')) return '{{testPassword}}';

  if (name.includes('email')) {
    if (p.includes('/auth/login')) return '{{adminEmail}}';
    if (p.includes('/patients/with-user')) return '{{testPatientEmail}}';
    if (p.includes('/doctors/with-user')) return '{{testDoctorEmail}}';
    if (p.includes('/password-reset')) return '{{patientEmail}}';
    return '{{testEmail}}';
  }

  if (name === 'name' || name === 'nombre') {
    if (p.includes('/specialties') && m === 'post') return '{{createdSpecialtyName}}';
    if (p.includes('/specialties') && ['put', 'patch'].includes(m)) return '{{updatedSpecialtyName}}';
    return '{{testName}}';
  }

  if (name.includes('firstname') || name.includes('first_name')) return 'Nombre Test';
  if (name.includes('lastname') || name.includes('last_name')) return 'Apellido Test';

  if (name.includes('cedula')) return '{{testCedula}}';
  if (name.includes('professional') || name.includes('license')) return '{{testProfessionalId}}';

  if (name.includes('description') || name.includes('descripcion')) return 'Dato generado automáticamente desde Postman';
  if (name.includes('reason') || name.includes('motivo')) return 'Prueba automatizada desde colección Postman';
  if (name.includes('bio')) return 'Perfil generado para prueba automatizada';
  if (name.includes('phone') || name.includes('telefono')) return '0999999999';

  if (name.includes('role') || name.includes('rol')) return '{{role}}';
  if (name.includes('status') || name.includes('estado')) return '{{status}}';

  if (name.includes('duration') || name.includes('minutes') || name.includes('minutos')) return 30;
  if (name.includes('fee') || name.includes('price') || name.includes('cost') || name.includes('amount') || name.includes('monto')) return 50;
  if (name === 'height') return 1.65;
  if (name === 'weight') return 62.5;
  if (name.includes('birth')) return '1995-04-18';
  if (name.includes('gender')) return 'female';
  if (name.includes('blood')) return 'O+';
  if (name.includes('address')) return 'Av. Principal 123';
  if (name.includes('city')) return 'Quito';
  if (name.includes('state') || name.includes('province')) return 'Pichincha';
  if (name.includes('country')) return 'Ecuador';
  if (name.includes('postal')) return '170101';
  if (name.includes('allerg')) return 'Ninguna';
  if (name.includes('condition')) return 'Ninguna';
  if (name.includes('medication')) return 'Ninguna';
  if (name.includes('contact')) return 'Contacto de emergencia';
  if (name.includes('relation')) return 'Familiar';
  if (name.includes('sessionid')) return '{{sessionId}}';
  if (name.includes('promoteexisting')) return false;

  if (schema?.enum?.length > 0) return schema.enum[0];

  if (schema?.example !== undefined) {
    const example = schema.example;

    if (
      example !== 'string' &&
      example !== 'String' &&
      example !== 0 &&
      example !== null &&
      example !== '00000000-0000-4000-8000-000000000001' &&
      example !== '00000000-0000-4000-8000-000000000002' &&
      example !== '00000000-0000-4000-8000-000000000003' &&
      example !== '00000000-0000-4000-8000-000000000004' &&
      example !== '00000000-0000-4000-8000-000000000005' &&
      example !== '00000000-0000-4000-8000-000000000006' &&
      !String(example).endsWith('.000Z')
    ) {
      return example;
    }
  }

  if (type === 'integer' || type === 'number') return 1;
  if (type === 'boolean') return true;
  if (type === 'array') return [];
  if (type === 'object') return {};

  return 'valor-prueba';
}

function buildBodyFromSchema(schema, routePath, method) {
  const resolved = resolveSchema(schema);

  if (!resolved) return null;

  const type = schemaType(resolved);

  if (type === 'object' || resolved.properties) {
    const body = {};
    const properties = resolved.properties || {};

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      const propertyResolved = resolveSchema(propertySchema);
      body[propertyName] = sampleValueForProperty(propertyName, propertyResolved, routePath, method);
    }

    return body;
  }

  return sampleValueForProperty('value', resolved, routePath, method);
}

function buildBodyFromOpenApi3RequestBody(operation, routePath, method) {
  const content = operation.requestBody?.content || {};

  const jsonContent =
    content['application/json'] ||
    content['application/*+json'] ||
    Object.values(content).find(value => value?.schema);

  if (!jsonContent) return null;

  return buildBodyFromSchema(jsonContent.schema, routePath, method);
}

function buildBodyFromSwagger2Parameters(operation, routePath, method) {
  if (!Array.isArray(operation.parameters)) return null;

  const bodyParam = operation.parameters.find(param =>
    String(param.in || '').toLowerCase() === 'body'
  );

  if (!bodyParam) return null;

  return buildBodyFromSchema(bodyParam.schema, routePath, method);
}

function fixedBodyByEndpoint(routePath, method) {
  const p = routePath.toLowerCase();
  const m = method.toLowerCase();

  if (p === '/api/v1/auth/register' && m === 'post') {
    return {
      email: '{{testPatientEmail}}',
      password: '{{testPassword}}',
      first_name: 'Paciente',
      last_name: 'Prueba',
      phone_number: '0999999999',
      cedula: '{{testCedula}}',
      date_of_birth: '1995-04-18',
      role: 'patient'
    };
  }

  if (p === '/api/v1/auth/login' && m === 'post') {
    return {
      email: '{{adminEmail}}',
      password: '{{adminPassword}}'
    };
  }

  if (p === '/api/v1/auth/password-reset/request' && m === 'post') {
    return {
      email: '{{patientEmail}}'
    };
  }

  if (p === '/api/v1/auth/password-reset/confirm' && m === 'post') {
    return {
      token: '{{resetToken}}',
      newPassword: '{{newPassword}}'
    };
  }

  if (p === '/api/v1/auth/change-password' && m === 'post') {
    return {
      currentPassword: '{{adminPassword}}',
      newPassword: '{{newPassword}}'
    };
  }

  if (p === '/api/v1/auth/refresh-token' && m === 'post') {
    return {
      token: '{{adminToken}}'
    };
  }

  if (p === '/api/v1/auth/logout' && m === 'post') {
    return {
      sessionId: '{{sessionId}}'
    };
  }

  if (p === '/api/v1/availability/check' && m === 'post') {
    return {
      doctorId: '{{doctorId}}',
      date: '{{scheduledDate}}',
      time: '{{scheduledTime}}'
    };
  }

  if ((p === '/api/v1/scheduling/book' || p === '/api/v1/appointments/' || p === '/api/v1/appointments') && m === 'post') {
    return {
      doctor_id: '{{doctorId}}',
      scheduled_start: '{{scheduledStart}}',
      reason: 'Consulta general de prueba automatizada'
    };
  }

  if (p.includes('/scheduling/reschedule') && m === 'put') {
    return {
      scheduled_start: '{{scheduledStart}}'
    };
  }

  if (p.includes('/scheduling/cancel') && m === 'post') {
    return {
      reason: 'Cancelación de prueba automatizada'
    };
  }

  if (p.includes('/scheduling/start') && m === 'post') {
    return {
      roomId: '{{roomId}}'
    };
  }

  if (p.includes('/appointments/') && p.includes('/cancel') && m === 'patch') {
    return {
      reason: 'Cancelada por prueba automatizada'
    };
  }

  if (p.includes('/appointments/') && m === 'delete') {
    return {
      reason: 'Cancelada por prueba automatizada'
    };
  }

  if (p.includes('/appointments/') && p.includes('/status') && m === 'patch') {
    return {
      status_id: 4
    };
  }

  if (p.includes('/appointments/') && m === 'patch') {
    return {
      doctor_id: '{{doctorId}}',
      consultation_room_id: '{{roomId}}'
    };
  }

  if (p.includes('/appointments/') && m === 'put') {
    return {
      reason: 'Control médico actualizado',
      consultation_room_id: '{{roomId}}'
    };
  }

  if (p === '/api/v1/specialties/' || p === '/api/v1/specialties') {
    if (m === 'post') {
      return {
        name: '{{createdSpecialtyName}}',
        description: 'Especialidad generada automáticamente desde Postman',
        consultation_fee: 45.5
      };
    }
  }

  if (p.includes('/specialties/') && ['put', 'patch'].includes(m)) {
    return {
      name: '{{updatedSpecialtyName}}',
      description: 'Especialidad actualizada automáticamente desde Postman',
      consultation_fee: 50
    };
  }

  if ((p === '/api/v1/doctors/' || p === '/api/v1/doctors') && m === 'post') {
    return {
      user_id: '{{userId}}',
      specialty_id: '{{specialtyId}}',
      professional_id: '{{testProfessionalId}}',
      bio: 'Especialista generado para prueba automatizada'
    };
  }

  if (p === '/api/v1/doctors/with-user' && m === 'post') {
    return {
      cedula: '{{testCedula}}',
      first_name: 'Doctor',
      last_name: 'Prueba',
      email: '{{testDoctorEmail}}',
      phone_number: '0999999999',
      specialty_id: '{{specialtyId}}',
      license_number: '{{testProfessionalId}}',
      status: 'active',
      promote_existing: false
    };
  }

  if (p.includes('/doctors/') && ['put', 'patch'].includes(m)) {
    return {
      specialty_id: '{{specialtyId}}',
      professional_id: '{{testProfessionalId}}',
      bio: 'Perfil actualizado desde Postman'
    };
  }

  if (p === '/api/v1/patients/with-user' && m === 'post') {
    return {
      email: '{{testPatientEmail}}',
      first_name: 'Paciente',
      last_name: 'Prueba',
      cedula: '{{testCedula}}',
      phone_number: '0999999999',
      date_of_birth: '1995-04-18',
      gender: 'female',
      blood_type: 'O+',
      address: 'Av. Principal 123',
      city: 'Quito',
      state: 'Pichincha',
      emergency_contact_name: 'Contacto Emergencia',
      emergency_contact_phone: '0987654321',
      emergency_contact_relation: 'Familiar',
      insurance_plan: 'Plan familiar',
      insurance_number: 'SEG-001',
      allergies: 'Ninguna',
      medical_conditions: 'Ninguna',
      current_medications: 'Ninguna',
      status: 'active',
      promote_existing: false
    };
  }

  if (p === '/api/v1/patients/me' && ['put', 'patch'].includes(m)) {
    return {
      first_name: 'Paciente',
      last_name: 'Actualizado',
      phone_number: '0999999999',
      address: 'Av. Principal 123',
      city: 'Quito',
      state: 'Pichincha',
      country: 'Ecuador',
      emergency_contact_name: 'Contacto Emergencia',
      emergency_contact_phone: '0987654321',
      emergency_contact_relation: 'Familiar',
      allergies: 'Ninguna',
      medical_conditions: 'Ninguna',
      current_medications: 'Ninguna',
      blood_type: 'O+',
      height: 1.65,
      weight: 62.5
    };
  }

  if (p.includes('/patients/') && ['put', 'patch'].includes(m)) {
    return {
      date_of_birth: '1995-04-18',
      gender: 'female',
      address: 'Av. Principal 123',
      city: 'Quito',
      state: 'Pichincha',
      postal_code: '170101',
      country: 'Ecuador',
      emergency_contact_name: 'Contacto Emergencia',
      emergency_contact_phone: '0987654321',
      emergency_contact_relation: 'Familiar',
      allergies: 'Ninguna',
      medical_conditions: 'Ninguna',
      current_medications: 'Ninguna',
      blood_type: 'O+',
      height: 1.65,
      weight: 62.5
    };
  }

  return null;
}

function buildRequestBody(operation, routePath, method) {
  const m = method.toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(m)) return null;

  const fixed = fixedBodyByEndpoint(routePath, method);
  if (fixed) return fixed;

  const fromOpenApi3 = buildBodyFromOpenApi3RequestBody(operation, routePath, method);
  if (fromOpenApi3) return fromOpenApi3;

  const fromSwagger2 = buildBodyFromSwagger2Parameters(operation, routePath, method);
  if (fromSwagger2) return fromSwagger2;

  return null;
}

function inferTests(routePath, method) {
  const p = routePath.toLowerCase();

  if (p.includes('/availability/doctor/') && p.includes('/date/')) {
    return saveAvailableSlotTests;
  }

  if (isAuthMeEndpoint(routePath, method)) {
    return authMeTests('adminUserId');
  }

  return saveIdsTests;
}

function requestName(method, routePath, operation) {
  const summary = operation.summary || operation.description;

  if (summary) return method.toUpperCase() + ' - ' + summary;

  return method.toUpperCase() + ' - ' + routePath;
}

function ensurePostmanFolder(folders, folderName) {
  if (!folders.has(folderName)) {
    folders.set(folderName, {
      name: folderName,
      item: []
    });
  }

  return folders.get(folderName);
}

function buildHealthFolder() {
  return {
    name: '00 - Health checks',
    item: [
      makeRequest({
        name: 'Health - External API',
        method: 'GET',
        url: '{{externalBaseUrl}}/health',
        auth: noAuth(),
        tests: commonTests
      }),
      makeRequest({
        name: 'Health - CRUD API',
        method: 'GET',
        url: '{{crudBaseUrl}}/health',
        auth: noAuth(),
        tests: commonTests
      }),
      makeRequest({
        name: 'Health - Business API',
        method: 'GET',
        url: '{{businessBaseUrl}}/health',
        auth: noAuth(),
        tests: commonTests
      })
    ]
  };
}

function buildAuthSetupFolder() {
  return {
    name: '01 - Setup autenticación',
    item: [
      makeRequest({
        name: 'Login paciente - guardar patientToken',
        method: 'POST',
        url: '{{externalBaseUrl}}/api/v1/auth/login',
        auth: noAuth(),
        body: {
          email: '{{patientEmail}}',
          password: '{{patientPassword}}'
        },
        tests: tokenSaveTests('patientToken', 'patientUserId')
      }),
      makeRequest({
        name: 'Login doctor - guardar doctorToken',
        method: 'POST',
        url: '{{externalBaseUrl}}/api/v1/auth/login',
        auth: noAuth(),
        body: {
          email: '{{doctorEmail}}',
          password: '{{doctorPassword}}'
        },
        tests: tokenSaveTests('doctorToken', 'doctorUserId')
      }),
      makeRequest({
        name: 'Login admin - guardar adminToken',
        method: 'POST',
        url: '{{externalBaseUrl}}/api/v1/auth/login',
        auth: noAuth(),
        body: {
          email: '{{adminEmail}}',
          password: '{{adminPassword}}'
        },
        tests: tokenSaveTests('adminToken', 'adminUserId')
      })
    ]
  };
}

function buildFilteredSwagger() {
  const filteredPaths = {};

  for (const [routePath, methods] of Object.entries(swagger.paths || {})) {
    const config = getModuleConfig(routePath);

    if (!config) continue;

    filteredPaths[routePath] = {};

    for (const [method, operation] of Object.entries(methods)) {
      if (!httpMethods.has(method.toLowerCase())) continue;

      filteredPaths[routePath][method] = {
        ...cleanOperation(operation),
        servers: [
          {
            url: config.server,
            description: config.description
          }
        ]
      };
    }
  }

  filteredPaths['/health'] = {
    get: {
      tags: ['Health'],
      summary: 'Verificar estado de las APIs',
      description: 'Permite comprobar si los servicios CRUD API, Business API y External API están activos.',
      parameters: [],
      responses: {
        200: {
          description: 'Servicio activo.'
        }
      },
      servers: [
        { url: '{{crudBaseUrl}}', description: 'CRUD API' },
        { url: '{{businessBaseUrl}}', description: 'Business API' },
        { url: '{{externalBaseUrl}}', description: 'External API' }
      ]
    }
  };

  const filteredSwagger = {
    ...swagger,
    info: {
      ...swagger.info,
      title: 'Sistema de Agendamiento de Citas Médicas - Todos los Endpoints',
      description: 'Swagger filtrado para todos los endpoints principales con servidores configurados mediante variables.'
    },
    servers: [
      { url: '{{crudBaseUrl}}', description: 'CRUD API' },
      { url: '{{businessBaseUrl}}', description: 'Business API' },
      { url: '{{externalBaseUrl}}', description: 'External API' }
    ],
    paths: filteredPaths,
    components: {
      ...(swagger.components || {}),
      securitySchemes: {
        ...(swagger.components?.securitySchemes || {}),
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };

  fs.writeFileSync(swaggerOutputPath, JSON.stringify(filteredSwagger, null, 2), 'utf8');

  return filteredSwagger;
}

function buildAllEndpointsCollection() {
  const folders = new Map();

  folders.set('00 - Health checks', buildHealthFolder());
  folders.set('01 - Setup autenticación', buildAuthSetupFolder());

  for (const [routePath, methods] of Object.entries(swagger.paths || {})) {
    if (routePath === '/health') continue;

    const config = getModuleConfig(routePath);
    if (!config) continue;

    const folderName = 'API - ' + config.description + ' - ' + config.name;
    const folder = ensurePostmanFolder(folders, folderName);

    for (const [method, rawOperation] of Object.entries(methods)) {
      if (!httpMethods.has(method.toLowerCase())) continue;

      const operation = cleanOperation(rawOperation);
      const url = buildUrl(routePath, config, operation);
      const tokenVariable = inferTokenVariable(routePath, method);
      const body = buildRequestBody(operation, routePath, method);

      const needsDynamicData = ['post', 'put', 'patch'].includes(method.toLowerCase());

      folder.item.push(makeRequest({
        name: requestName(method, routePath, operation),
        method,
        url,
        auth: tokenVariable ? bearerAuth(tokenVariable) : noAuth(),
        body,
        prerequest: needsDynamicData ? dynamicPreRequest : null,
        tests: inferTests(routePath, method)
      }));
    }
  }

  const collection = {
    info: {
      name: 'MedicalAppointment - Todos los Endpoints',
      description: 'Colección generada automáticamente desde swagger-output.json. Incluye endpoints detectados, variables de entorno, autenticación por rol y scripts para guardar IDs.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [...folders.values()],
    event: [
      testEvent(commonTests)
    ],
    variable: []
  };

  fs.writeFileSync(collectionOutputPath, JSON.stringify(collection, null, 2), 'utf8');

  return collection;
}

function buildPostmanEnvironment() {
  const environment = {
    name: 'MedicalAppointment',
    values: [
      { key: 'externalBaseUrl', value: 'http://localhost:3003', type: 'default', enabled: true },
      { key: 'crudBaseUrl', value: 'http://localhost:3001', type: 'default', enabled: true },
      { key: 'businessBaseUrl', value: 'http://localhost:3002', type: 'default', enabled: true },

      { key: 'patientEmail', value: 'paciente1@example.com', type: 'default', enabled: true },
      { key: 'patientPassword', value: 'ClaveSegura1', type: 'secret', enabled: true },
      { key: 'patientToken', value: '', type: 'secret', enabled: true },
      { key: 'patientUserId', value: '', type: 'default', enabled: true },
      { key: 'patientId', value: '', type: 'default', enabled: true },

      { key: 'doctorEmail', value: 'doctor@clinica.com', type: 'default', enabled: true },
      { key: 'doctorPassword', value: 'admin123', type: 'secret', enabled: true },
      { key: 'doctorToken', value: '', type: 'secret', enabled: true },
      { key: 'doctorUserId', value: '', type: 'default', enabled: true },
      { key: 'doctorId', value: '', type: 'default', enabled: true },

      { key: 'adminEmail', value: 'admin@clinica.com', type: 'default', enabled: true },
      { key: 'adminPassword', value: 'admin123', type: 'secret', enabled: true },
      { key: 'adminToken', value: '', type: 'secret', enabled: true },
      { key: 'adminUserId', value: '', type: 'default', enabled: true },

      { key: 'userId', value: '', type: 'default', enabled: true },
      { key: 'patientUserId', value: '', type: 'default', enabled: true },
      { key: 'specialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyName', value: '', type: 'default', enabled: true },
      { key: 'updatedSpecialtyName', value: '', type: 'default', enabled: true },

      { key: 'appointmentId', value: '', type: 'default', enabled: true },
      { key: 'scheduleId', value: '', type: 'default', enabled: true },
      { key: 'roomId', value: '', type: 'default', enabled: true },
      { key: 'medicalRecordId', value: '', type: 'default', enabled: true },
      { key: 'prescriptionId', value: '', type: 'default', enabled: true },
      { key: 'billingId', value: '', type: 'default', enabled: true },
      { key: 'billingItemId', value: '', type: 'default', enabled: true },
      { key: 'insuranceProviderId', value: '', type: 'default', enabled: true },
      { key: 'medicalServiceId', value: '', type: 'default', enabled: true },

      { key: 'scheduledDate', value: '2026-07-01', type: 'default', enabled: true },
      { key: 'scheduledTime', value: '09:30', type: 'default', enabled: true },
      { key: 'timezoneOffset', value: '-05:00', type: 'default', enabled: true },
      { key: 'scheduledStart', value: '2026-07-01T09:30:00-05:00', type: 'default', enabled: true },

      { key: 'startDate', value: '2026-07-01', type: 'default', enabled: true },
      { key: 'endDate', value: '2026-07-31', type: 'default', enabled: true },
      { key: 'page', value: '1', type: 'default', enabled: true },
      { key: 'limit', value: '10', type: 'default', enabled: true },
      { key: 'search', value: '', type: 'default', enabled: true },
      { key: 'status', value: 'active', type: 'default', enabled: true },
      { key: 'role', value: 'admin', type: 'default', enabled: true },
      { key: 'active', value: 'true', type: 'default', enabled: true },
      { key: 'includeCancelled', value: 'true', type: 'default', enabled: true },

      { key: 'testName', value: '', type: 'default', enabled: true },
      { key: 'testEmail', value: '', type: 'default', enabled: true },
      { key: 'testPatientEmail', value: '', type: 'default', enabled: true },
      { key: 'testDoctorEmail', value: '', type: 'default', enabled: true },
      { key: 'testCedula', value: '', type: 'default', enabled: true },
      { key: 'testProfessionalId', value: '', type: 'default', enabled: true },
      { key: 'testPassword', value: 'ClaveSegura1', type: 'secret', enabled: true },
      { key: 'newPassword', value: 'NuevaClave1', type: 'secret', enabled: true },
      { key: 'resetToken', value: '', type: 'default', enabled: true },
      { key: 'sessionId', value: '', type: 'default', enabled: true },
      { key: 'id', value: '', type: 'default', enabled: true }
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_using: 'ChatGPT'
  };

  fs.writeFileSync(environmentOutputPath, JSON.stringify(environment, null, 2), 'utf8');
}

function main() {
  ensureDir(postmanDir);

  const filteredSwagger = buildFilteredSwagger();
  const collection = buildAllEndpointsCollection();
  buildPostmanEnvironment();

  let operationCount = 0;

  for (const methods of Object.values(filteredSwagger.paths)) {
    operationCount += Object.keys(methods)
      .filter(method => httpMethods.has(method.toLowerCase()))
      .length;
  }

  console.log('Archivos generados correctamente.');
  console.log(`Swagger completo: ${swaggerOutputPath}`);
  console.log(`Colección Postman completa: ${collectionOutputPath}`);
  console.log(`Environment Postman: ${environmentOutputPath}`);
  console.log(`Paths incluidos en Swagger: ${Object.keys(filteredSwagger.paths).length}`);
  console.log(`Operaciones HTTP incluidas en Swagger: ${operationCount}`);
  console.log(`Carpetas Postman incluidas: ${collection.item.length}`);
  console.log('Colección generada con autenticación y bodies corregidos por reglas específicas.');
}

main();