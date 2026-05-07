# Auditoría Arquitectónica REST - Sistema de Citas Médicas

## Índice
1. FASE 1: Inventario de URIs
2. FASE 2: Auditoría de los 5 Constraints REST
3. FASE 3: Análisis de Brechas y Expansión
4. FASE 4: Reestructuración Arquitectónica
5. FASE 5: Optimización y Cacheable

---

## FASE 1: Inventario de URIs

### Tabla Completa de Endpoints Actuales

| URI/Endpoint | Método | Ubicación | Uso/Consumo | Propósito | Tipo Actual |
|---|---|---|---|---|---|
| /api/auth/login | POST | backend/server.js:24 | panels/login.html:95 | Autenticar usuario con email/password | Lógica de Negocio |
| /api/auth/login | POST | backend/routes/auth.js:98 | panels/login.html:95 | Autenticar usuario (ruta duplicada) | Lógica de Negocio |
| /api/auth/register | POST | backend/routes/auth.js:141 | panels/register.html:166 | Registro de pacientes nuevos | Lógica de Negocio |
| /api/auth/google | GET | backend/routes/auth.js:12 (OAuth redirect) | Inicio de autenticación Google | OAuth Lógica de Negocio |
| /api/auth/google/callback | GET | backend/routes/auth.js:17 (OAuth callback) | Callback de autenticación Google | Lógica de Negocio |
| /api/patients/profile | GET | backend/routes/patient.js:10 | js/patient/patientProfile.js | Obtener perfil completo del paciente | CRUD Básico |
| /api/patients/profile | PUT | backend/routes/patient.js:11 | js/patient/patientProfile.js | Actualizar perfil del paciente | CRUD Básico |
| /api/patients/complete-profile | PUT | backend/routes/patient.js:12 | panels/completeProfile.html:203 | Completar perfil después de OAuth | Lógica de Negocio |
| /api/patients/change-password | POST | backend/routes/patient.js:13 | js/api.js:48 | Cambiar contraseña del paciente | Lógica de Negocio |
| /api/doctors | GET | backend/routes/doctor.js:33 | js/api.js:83 | Obtener lista de doctores | CRUD Básico |
| /api/doctors | POST | backend/routes/doctor.js:30 | panels/Admin/GestionDoctores.html:220 | Crear nuevo doctor | CRUD Básico |
| /api/doctors/:id | GET | backend/routes/doctor.js:36 | js/api.js:90 | Obtener doctor por ID | CRUD Básico |
| /api/doctors/:id | PUT | backend/routes/doctor.js:39 | GestionDoctores.html | Actualizar doctor | CRUD Básico |
| /api/doctors/:id | DELETE | backend/routes/doctor.js:42 | GestionDoctores.html | Eliminar doctor | CRUD Básico |
| /api/doctors/specialties | GET | backend/routes/doctor.js:15 | js/api.js:69 | Obtener lista de especialidades | CRUD Básico |
| /api/doctors/stats | GET | backend/routes/doctor.js:18 | panels/Admin/GestionDoctores.html:295 | Estadísticas de doctores | Lógica de Negocio |
| /api/doctors/filter | GET | backend/routes/doctor.js:21 | panels/Admin/GestionDoctores.html:309 | Filtrar doctores | Lógica de Negocio |
| /api/doctors/specialty/:specialty_id | GET | backend/routes/doctor.js:24 | No usado | Doctores por especialidad | CRUD Básico |
| /api/doctors/:id/schedules | GET | backend/routes/doctor.js:47 | No usado | Horarios de un doctor | CRUD Básico |
| /api/doctors/:id/status | PATCH | backend/routes/doctor.js:50 | GestionDoctores.html | Activar/desactivar doctor | Lógica de Negocio |
| /api/doctors/patients | GET | backend/routes/doctor.js:10 | js/doctorPatients.js:14 | Lista pacientes para doctor | CRUD Básico |
| /api/doctors/patients | POST | backend/routes/doctor.js:11 | doctorPatients.js | Crear paciente desde doctor | CRUD Básico |
| /api/doctors/patients/:userId/record | GET | backend/routes/doctor.js:12 | doctorPatients.js | Historial clínico de paciente | CRUD Básico |
| /api/patients | GET | backend/routes/patientRoutes.js:14 | No usado | Lista pacientes (duplicado) | CRUD Básico |
| /api/patients | POST | backend/routes/patientRoutes.js:17 | No usado | Crear paciente (duplicado) | CRUD Básico |
| /api/patients/:id | GET | backend/routes/patientRoutes.js:20 | No usado | Obtener paciente por ID | CRUD Básico |
| /api/patients/:id | PUT | backend/routes/patientRoutes.js:23 | No usado | Actualizar paciente | CRUD Básico |
| /api/patients/:id | DELETE | backend/routes/patientRoutes.js:26 | No usado | Eliminar paciente | CRUD Básico |
| /api/appointments/doctors/:doctorId/available-slots | GET | backend/routes/appointments.js:9 | js/api.js:93 , js/patient/newAppointment.js | Slots disponibles de doctor | Lógica de Negocio |
| /api/appointments | POST | backend/routes/appointments.js:12 | js/api.js:120 | Crear cita | Lógica de Negocio |
| /api/appointments/patient | GET | backend/routes/appointments.js:13 | js/api.js:106 , js/patient/patientAppointments.js:36 | Citas del paciente logueado | CRUD Básico |
| /api/appointments/:id | GET | backend/routes/appointments.js:14 | js/api.js:113 | Detalle de cita | CRUD Básico |
| /api/appointments/:id | DELETE | backend/routes/appointments.js:15 | js/api.js:132 | Cancelar cita | Lógica de Negocio |
| /api/appointments/:id/reschedule | PUT | backend/routes/appointments.js:16 | js/api.js:138 | Reagendar cita | Lógica de Negocio |
| /api/appointments/doctor | GET | backend/routes/appointments.js:19 | No usado | Citas del doctor logueado | CRUD Básico |
| /api/appointments/:id/status | PATCH | backend/routes/appointments.js:20 | No usado | Actualizar estado de cita | Lógica de Negocio |
| /api/medical-records | GET | backend/routes/medicalRecord.js:10 | js/api.js:151 | Registro médico del paciente | CRUD Básico |
| /api/medical-records/consultation-notes | GET | backend/routes/medicalRecord.js:11 | js/api.js:158 , js/patient/patientHistory.js:36 | Notas de consultas | CRUD Básico |
| /api/medical-records/consultation-notes/:appointmentId | GET | backend/routes/medicalRecord.js:12 | js/api.js:164 | Nota de consulta específica | CRUD Básico |
| /api/medical-records/summary | GET | backend/routes/medicalRecord.js:13 | js/api.js:172 , js/patient/patientDashboard.js:117 | Resumen del historial | Lógica de Negocio |
| /api/medical-records/lab-reports | GET | backend/routes/medicalRecord.js:14 | js/api.js:177 , js/patient/patientLab.js:16 | Reportes de laboratorio | CRUD Básico |
| /api/specialties | GET | backend/routes/specialty.js:14 | GestionEspecialidad.html | Lista de especialidades | CRUD Básico |
| /api/specialties | POST | backend/routes/specialty.js:6 | GestionEspecialidad.html | Crear especialidad | CRUD Básico |
| /api/specialties/stats | GET | backend/routes/specialty.js:9 | panels/Admin/GestionEspecialidad.html:173 | Estadísticas especialidades | Lógica de Negocio |
| /api/specialties/filter | GET | backend/routes/specialty.js:10 | No usado | Filtrar especialidades | Lógica de Negocio |
| /api/specialties/active | GET | backend/routes/specialty.js:11 | No usado | Especialidades activas | CRUD Básico |
| /api/specialties/:id | GET | backend/routes/specialty.js:18 | No usado | Especialidad por ID | CRUD Básico |
| /api/specialties/:id | PUT | backend/routes/specialty.js:19 | GestionEspecialidad.html | Actualizar especialidad | CRUD Básico |
| /api/specialties/:id | DELETE | backend/routes/specialty.js:20 | GestionEspecialidad.html | Eliminar especialidad | CRUD Básico |
| /api/specialties/:id/status | PATCH | backend/routes/specialty.js:21 | No usado | Cambiar estado especialidad | Lógica de Negocio |
| /api/specialties/:id/doctors | GET | backend/routes/specialty.js:17 | No usado | Doctores de especialidad | CRUD Básico |
| /api/test | GET | backend/server.js:125 | js/api.js:189 | Prueba de conexión | Lógica de Negocio |

### Análisis de Duplicaciones y Problemas

**Problemas Identificados:**

1. **Duplicación de ruta `/api/auth/login`**: Existe en `server.js:24` y `routes/auth.js:98`. Esto genera confusión y riesgo de inconsistencias.

2. **Rutas de pacientes duplicadas**:
   - `/api/doctors/patients` (usada activamente)
   - `/api/patients` (ruta zombi, no usada)
   - Ambas exponen los mismos recursos pero en diferentes contextos.

3. **Endpoints no consumidos**:
   - `/api/doctors/specialty/:specialty_id`
   - `/api/specialties/active`
   - `/api/specialties/:id/doctors`
   - `/api/appointments/doctor`
   - Estas rutas están definidas pero no se usan en el frontend.

4. **Falta de endpoints DELETE para lógica de negocio**: Las eliminaciones de doctores y especialidades son físicas, no lógicas (soft delete).

5. **Inconsistencia en nomenclatura**:
   - Algunos endpoints usan `/api/doctors/:id/status` (PATCH)
   - Otros usan `/api/appointments/:id` (DELETE) para cancelar

---

## FASE 2: Auditoría de los 5 Constraints REST

### 1. Client-Server (Separación de Responsabilidades)

**¿Se cumple?** Parcialmente (70%)

**Cumplimientos:**
- ✅ El servidor (`backend/`) maneja toda la lógica de base de datos y autenticación.
- ✅ El cliente (`js/`, `panels/`) solo hace peticiones HTTP y renderiza UI.
- ✅ Uso correcto de JWT para autenticación stateless.

**Violaciones Encontradas:**

❌ **Lógica de Negocio en el Cliente:**

Archivo: `report.js` (líneas 25-92)
```javascript
const generateDynamicData = () => {
    const today = new Date();
    const allCitas = [
        { fecha: formatDate(today), hora: '10:00', paciente: 'Ana García', ... },
        // Datos generados en cliente
    ];
    return { allCitas, allConsultasModificadas };
};
```
Problema: El cliente genera datos de reportes. Esta lógica debe estar en el servidor.

Archivo: `appointmentManager.js` (líneas 32-72)
```javascript
getInitialData() {
    return [
        { id: 1, patientName: 'Carlos Mendoza', ... },
        // Datos hardcodeados en cliente
    ];
}
```
Problema: Datos de citas simulados en el cliente. Debe eliminarse y consumir API real.

Archivo: `doctorPrescription.js` (líneas 5-28)
```javascript
const initialMockData = {
    patients: [
        { id: 'p1', name: 'Ana García' },
        // Mock data en cliente
    ],
    prescriptions: { ... }
};
```
Problema: Datos de prescripciones en cliente. Debe ser API del servidor.

**¿Qué falta?**

- Mover lógica de reportes al servidor:
  - Crear endpoint `/api/reports/appointments` que acepte parámetros de fecha.
  - Crear endpoint `/api/reports/stats` para estadísticas.

- Eliminar todos los mock data del cliente:
  - Archivos a limpiar: `report.js`, `appointmentManager.js`, `doctorPrescription.js`, `doctorManagement.js`

- Crear servicios en el backend para lógica compleja:
  - Servicio de reportes
  - Servicio de estadísticas
  - Servicio de prescripciones

**¿Dónde editar?**

**Paso 1: Crear Controlador de Reportes**

```javascript
// Archivo NUEVO: backend/controllers/reportController.js
const supabase = require('../database');

const reportController = {
  getAppointmentsByPeriod: async (req, res) => {
    try {
      const { startDate, endDate, period } = req.query;
      const doctorId = req.user.doctorId; // Desde token
      // Lógica de consulta a BD
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(*), doctors(*)')
        .eq('doctor_id', doctorId)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate);
      if (error) throw error;
      res.json({
        appointments: data,
        summary: {
          total: data.length,
          confirmed: data.filter(a => a.status_id === 2).length,
          cancelled: data.filter(a => a.status_id === 5).length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
module.exports = reportController;
```

**Paso 2: Crear Ruta de Reportes**

```javascript
// Archivo NUEVO: backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireRole('doctor', 'admin'));

router.get('/appointments', reportController.getAppointmentsByPeriod);

module.exports = router;
```

**Paso 3: Registrar Ruta en Server**

```javascript
// Archivo: backend/server.js (después de línea 115)
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);
```

**Paso 4: Actualizar Cliente**

```javascript
// Archivo: js/report.js (reemplazar líneas 25-92)
async function loadAppointmentsReport(period) {
  try {
    const { startDate, endDate } = getDateRange(period);
    const response = await fetchWithAuth(
      `${API_URL}/reports/appointments?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();
    renderCitas(data.appointments);
  } catch (error) {
    console.error('Error loading report:', error);
  }
}
```

---

### 2. Stateless (Sin Estado en el Servidor)

**¿Se cumple?** Sí (90%)

**Cumplimientos:**
- ✅ Uso de JWT para autenticación (no sesiones en memoria).
- ✅ Token enviado en headers `Authorization: Bearer`.
- ✅ Cada petición es independiente.

**Violaciones Menores:**

⚠️ **Sesiones de Passport (Problema de Diseño):**

Archivo: `server.js` (líneas 28-37)
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
app.use(passport.initialize());
app.use(passport.session());
```
Problema: Aunque las sesiones son solo para OAuth (Google), violan el principio stateless. El servidor mantiene estado de sesión.

**¿Qué falta?**

- Eliminar `express-session` para OAuth.
- Pasar a flujo stateless: OAuth retorna token JWT directamente.
- No usar `passport.session()`.
- Verificar que no haya estado compartido: Variables globales en `server.js`. Caché en memoria (debe ser Redis/Memcached si se usa).

**¿Dónde editar?**

**Paso 1: Modificar OAuth para Stateless**

```javascript
// Archivo: backend/routes/auth.js (líneas 17-85, reemplazar callback)
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, // ⬅️ IMPORTANTE: NO crear sesión
    failureRedirect: '/panels/login.html?error=google_auth_failed' 
  }),
  async (req, res) => {
    try {
      // Generar JWT inmediatamente (SIN sesión)
      const token = jwt.sign(
        { userId: req.user.id, role: req.user.roles.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const payload = { token, user: req.user };
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/MedicalAppointment';
      res.redirect(`${frontendUrl}/panels/patient/patientDashboard.html?oauth=${payloadEncoded}`);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect('/panels/login.html?error=callback_failed');
    }
  }
);
```

**Paso 2: Eliminar Middleware de Sesión**

```javascript
// Archivo: backend/server.js (ELIMINAR líneas 28-40)
// ❌ BORRAR ESTO:
// app.use(session({ ... }));
// app.use(passport.initialize());
// app.use(passport.session());

// ✅ MANTENER SOLO:
app.use(passport.initialize()); // SIN session()
```

**Paso 3: Actualizar Configuración de Passport**

```javascript
// Archivo: backend/config/passport.js (eliminar líneas 50-60)
// ❌ BORRAR serializeUser y deserializeUser
// passport.serializeUser(...);
// passport.deserializeUser(...);
```

---

### 3. Layered System (Sistema en Capas)

**¿Se cumple?** Parcialmente (60%)

**Cumplimientos:**
- ✅ Separación clara: Frontend → Backend → Base de Datos.
- ✅ Uso de middleware de autenticación `auth.js`.
- ✅ CORS configurado para permitir proxies.

**Violaciones:**

❌ **Acoplamiento Directo a Supabase:**

Archivo: Múltiples controladores (ej. `backend/controllers/doctorController.js`)
```javascript
const { data, error } = await supabase
  .from('doctors')
  .select('*');
```
Problema: Los controladores acceden directamente a la base de datos. Si cambio de Supabase a PostgreSQL directo o MongoDB, debo modificar 20+ archivos.

❌ **Lógica de Negocio en Controladores:**

Archivo: `appointmentController.js` (líneas 28-85)
Problema: El controlador hace todo (Validaciones, verificar disponibilidad, crear cita, responder). Debería delegar a un servicio.

**¿Qué falta?**

- Crear capa de Repositorios/DAOs: Abstraer acceso a Supabase.
- Separar Servicios de Lógica de Negocio: Mover validaciones y reglas de negocio a servicios.
- Usar Servicios Intermedios: Los controladores solo deben orquestar, no ejecutar lógica.

**¿Dónde editar?**

**Paso 1: Crear Repositorio de Doctores**

```javascript
// Archivo NUEVO: backend/repositories/doctorRepository.js
const supabase = require('../database');

class DoctorRepository {
  async findAll(filters = {}) {
    let query = supabase.from('doctors').select(`
      *,
      users!inner(first_name, last_name, email),
      specialties(name)
    `);
    
    if (filters.specialty_id) {
      query = query.eq('specialty_id', filters.specialty_id);
    }
    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users(*), specialties(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(doctorData) {
    const { data, error } = await supabase
      .from('doctors')
      .insert([doctorData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id, doctorData) {
    const { data, error } = await supabase
      .from('doctors')
      .update(doctorData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    return this.update(id, { active: false, deleted_at: new Date() });
  }
}

module.exports = new DoctorRepository();
```

**Paso 2: Crear Servicio de Doctores**

```javascript
// Archivo NUEVO: backend/services/doctorService.js
const doctorRepository = require('../repositories/doctorRepository');
const { validateCedula } = require('../utils/validation');

class DoctorService {
  async getAllDoctors(filters) {
    // Lógica de negocio: filtros, permisos, etc.
    return await doctorRepository.findAll(filters);
  }

  async getDoctorById(id) {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }
    return doctor;
  }

  async createDoctor(doctorData) {
    // Validaciones de negocio
    if (!validateCedula(doctorData.cedula)) {
      throw new Error('Cédula inválida');
    }
    
    // Verificar duplicados
    const existingDoctors = await doctorRepository.findAll({ 
      cedula: doctorData.cedula 
    });
    if (existingDoctors.length > 0) {
      throw new Error('Ya existe un doctor con esta cédula');
    }
    
    return await doctorRepository.create(doctorData);
  }

  async updateDoctor(id, doctorData) {
    await this.getDoctorById(id); // Verificar que existe
    return await doctorRepository.update(id, doctorData);
  }

  async deleteDoctor(id) {
    // Soft delete
    return await doctorRepository.softDelete(id);
  }
}

module.exports = new DoctorService();
```

**Paso 3: Simplificar Controlador**

```javascript
// Archivo: backend/controllers/doctorController.js (reemplazar)
const doctorService = require('../services/doctorService');

const doctorController = {
  getAllDoctors: async (req, res) => {
    try {
      const filters = {
        specialty_id: req.query.specialty_id,
        active: req.query.active
      };
      const doctors = await doctorService.getAllDoctors(filters);
      res.json(doctors);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getDoctorById: async (req, res) => {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      res.json(doctor);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createDoctor: async (req, res) => {
    try {
      const doctor = await doctorService.createDoctor(req.body);
      res.status(201).json(doctor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateDoctor: async (req, res) => {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);
      res.json(doctor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteDoctor: async (req, res) => {
    try {
      await doctorService.deleteDoctor(req.params.id);
      res.json({ message: 'Doctor eliminado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = doctorController;
```

**Beneficios de esta Arquitectura:**
- Desacoplamiento: Cambiar de Supabase a otra BD solo afecta `repositories/`.
- Testabilidad: Puedo hacer mock de repositorios en tests.
- Mantenibilidad: Lógica de negocio centralizada en servicios.
- Escalabilidad: Fácil agregar caché, logging, métricas en capas intermedias.

---

### 4. Code on Demand (Código Bajo Demanda)

**¿Se cumple?** No Implementado (Opcional)

**Estado Actual:**
- ❌ No se envía código ejecutable desde el servidor al cliente.
- ✅ Esto es opcional según REST, pero puede ser útil.

**Casos de Uso Potenciales:**
- Validaciones Dinámicas del Frontend: El servidor podría enviar funciones de validación según el formulario. Útil para reglas de negocio que cambian frecuentemente.
- Widgets/Componentes Dinámicos: Enviar componentes React/Vue desde el servidor.
- Configuración de UI: Enviar estilos CSS o scripts de configuración.

**¿Qué falta?**

No es crítico implementarlo ahora, pero si decides hacerlo:

**Endpoint para Scripts Dinámicos:**

```javascript
// Archivo NUEVO: backend/routes/dynamic.js
router.get('/validators/:formType', async (req, res) => {
  const { formType } = req.params;
  // Según el tipo de formulario, retornar función de validación
  const validator = generateValidatorCode(formType);
  res.set('Content-Type', 'application/javascript');
  res.send(validator);
});
```

**Cliente Carga Script:**

```javascript
// Archivo: js/patient/newAppointment.js
async function loadFormValidators() {
  const script = document.createElement('script');
  script.src = `${API_URL}/dynamic/validators/appointment`;
  document.head.appendChild(script);
}
```

**Recomendación:** No implementar por ahora. Es opcional y agrega complejidad. Enfocarse en los otros 4 constraints primero.

---

### 5. Uniform Interface (Interfaz Uniforme) - EL MÁS IMPORTANTE

**¿Se cumple?** Parcialmente (55%)

Este constraint tiene 4 sub-restricciones:

#### 5.1. Identificación de Recursos

**¿Se cumple?** Parcialmente (70%)

**Cumplimientos:**
- ✅ URIs identifican recursos: `/api/doctors/:id`, `/api/appointments/:id`.
- ✅ Uso de sustantivos (no verbos): `/doctors` en lugar de `/getDoctors`.

**Violaciones:**

❌ **Inconsistencia en Plurales:**
- ✅ `/api/doctors` (plural)
- ✅ `/api/specialties` (plural)
- ❌ `/api/medical-records` (debería ser `/api/patients/:id/medical-record` singular)

❌ **Anidamiento Incorrecto:**

Archivo: `doctor.js` (línea 10)
```
router.get('/patients', patientManagementController.getPatientList);
```
Problema: `/api/doctors/patients` está mal. Los pacientes no son "hijos" de doctores. Debería ser `/api/patients` con filtro opcional `?assigned_to=doctorId`.

Archivo: `appointments.js` (línea 9)
```
router.get('/doctors/:doctorId/available-slots', appointmentController.getAvailableSlots);
```
Problema: Los slots no son un recurso independiente. Debería ser `/api/doctors/:id/availability?date=2025-01-15`.

**¿Qué falta?**

- Estandarizar Plurales: Todos los recursos en plural: `/doctors`, `/appointments`, `/patients`. Excepto recursos singleton: `/api/patients/me/medical-record` (singular porque es único por paciente).
- Corregir Anidamiento:
  - Mover `/api/doctors/patients` a `/api/patients?doctor_id=X`.
  - Cambiar `/api/appointments/doctors/:id/available-slots` a `/api/doctors/:id/availability`.
- Usar Sub-recursos Lógicos:
  - `/api/patients/:id/appointments` (citas de un paciente).
  - `/api/doctors/:id/schedules` (horarios de un doctor).

**¿Dónde editar?**

**Paso 1: Reestructurar Ruta de Pacientes**

```javascript
// Archivo: backend/routes/patient.js (agregar después de línea 13)
router.get('/', patientManagementController.getPatientList); 
// Ahora es /api/patients (con query params opcionales)
```

**Paso 2: Agregar Filtros en Controlador**

```javascript
// Archivo: backend/controllers/patientManagementController.js (modificar línea 18)
exports.getPatientList = async (req, res) => {
  try {
    const doctorId = req.query.doctor_id; // Filtro opcional
    const patients = await patientService.getPatientsList(doctorId);
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Paso 3: Cambiar Slots a Availability**

```javascript
// Archivo: backend/routes/doctor.js (reemplazar línea 47)
router.get('/:id/availability', doctorController.getDoctorAvailability);
```

**Paso 4: Actualizar Controlador**

```javascript
// Archivo: backend/controllers/doctorController.js (agregar método)
getDoctorAvailability: async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // 2025-01-15
    const slots = await availabilityService.getAvailableSlots(id, date);
    res.json({ 
      doctor_id: id,
      date,
      available_slots: slots 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Paso 5: Actualizar Cliente**

```javascript
// Archivo: js/api.js (líneas 93-98, reemplazar)
getAvailableSlots: async (doctorId, date) => {
  const response = await fetchWithAuth(
    `${API_URL}/doctors/${doctorId}/availability?date=${date}` // Nueva URI
  );
  return response.json();
}
```

#### 5.2. Manipulación de Recursos mediante Representaciones

**¿Se cumple?** Sí (85%)

**Cumplimientos:**
- ✅ JSON como formato estándar.
- ✅ Respuestas incluyen todos los datos necesarios.
- ✅ Cabeceras `Content-Type: application/json`.

**Violaciones Menores:**

⚠️ **Respuestas Inconsistentes:**

Ejemplo 1: `doctorController.js` (línea 334)
```
{ "message": "Doctor eliminado", "deleted": { "id": 1, "name": "..." } }
```

Ejemplo 2: `specialtyController.js` (línea 82)
```
{ "message": "Especialidad eliminada exitosamente" }
```

Problema: Las respuestas DELETE no son consistentes. Algunas incluyen el objeto eliminado, otras solo mensaje.

**¿Qué falta?**

- Estandarizar Respuestas: Definir formato global para todas las respuestas. Usar envelopes consistentes.
- Incluir Metadata: 
  - Paginación: `{ data: [...], meta: { page, total, per_page } }`.
  - HATEOAS (opcional): Links a recursos relacionados.

**¿Dónde editar?**

**Paso 1: Crear Helper de Respuestas**

```javascript
// Archivo NUEVO: backend/utils/responseFormatter.js
class ResponseFormatter {
  static success(data, message = null, meta = {}) {
    return {
      success: true,
      message,
      data,
      meta
    };
  }

  static error(message, code = 'INTERNAL_ERROR', details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
  }

  static paginated(items, page, perPage, total) {
    return {
      success: true,
      data: items,
      meta: {
        page: parseInt(page),
        per_page: parseInt(perPage),
        total,
        total_pages: Math.ceil(total / perPage)
      }
    };
  }

  static deleted(resource) {
    return {
      success: true,
      message: 'Recurso eliminado exitosamente',
      data: {
        deleted: resource
      }
    };
  }
}

module.exports = ResponseFormatter;
```

**Paso 2: Usar en Controladores**

```javascript
// Archivo: backend/controllers/doctorController.js (línea 334, reemplazar)
const ResponseFormatter = require('../utils/responseFormatter');

deleteDoctor: async (req, res) => {
  try {
    const deleted = await doctorService.deleteDoctor(req.params.id);
    res.json(ResponseFormatter.deleted(deleted));
  } catch (error) {
    res.status(400).json(ResponseFormatter.error(error.message, 'DELETE_FAILED'));
  }
}
```

#### 5.3. Mensajes Auto-Descriptivos

**¿Se cumple?** Parcialmente (60%)

**Cumplimientos:**
- ✅ Uso de códigos HTTP correctos: 200, 201, 400, 404, 500.
- ✅ Headers `Content-Type` presentes.

**Violaciones:**

❌ **Falta de Códigos HTTP Específicos:**

Archivo: `doctorController.js` (línea 80)
```
return res.status(404).json({ error: 'Doctor no encontrado' }); // ✅ Correcto
```

Archivo: `appointmentController.js` (línea 42)
```
return res.status(400).json({ error: 'Horario no disponible' }); // ❌ Debería ser 409 Conflict
```

❌ **Falta de Headers de Caché:** Ningún endpoint tiene headers `Cache-Control`, `ETag`, o `Last-Modified`.

**¿Qué falta?**

- Usar Códigos HTTP Correctos:
  - `409 Conflict` para conflictos de negocio (horario ocupado).
  - `422 Unprocessable Entity` para validaciones fallidas.
  - `204 No Content` para DELETE exitosos sin cuerpo.
- Agregar Headers de Caché:
  - `Cache-Control: max-age=3600` para GET de recursos estáticos.
  - `ETag` para validación de cambios.
- Mensajes de Error Descriptivos:
  - Incluir código de error único: `ERROR_SLOT_UNAVAILABLE`.
  - Incluir detalles útiles para debugging.

**¿Dónde editar?**

**Paso 1: Definir Códigos de Error**

```javascript
// Archivo NUEVO: backend/utils/errorCodes.js
module.exports = {
  // Autenticación
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH_001', status: 401, message: 'Credenciales inválidas' },
  AUTH_TOKEN_EXPIRED: { code: 'AUTH_002', status: 401, message: 'Token expirado' },
  // Recursos
  RESOURCE_NOT_FOUND: { code: 'RES_001', status: 404, message: 'Recurso no encontrado' },
  RESOURCE_ALREADY_EXISTS: { code: 'RES_002', status: 409, message: 'Recurso ya existe' },
  // Validación
  VALIDATION_FAILED: { code: 'VAL_001', status: 422, message: 'Validación fallida' },
  // Citas
  APPOINTMENT_SLOT_UNAVAILABLE: { code: 'APT_001', status: 409, message: 'Horario no disponible' },
  APPOINTMENT_PAST_DATE: { code: 'APT_002', status: 400, message: 'No se puede agendar en el pasado' },
  // Servidor
  INTERNAL_ERROR: { code: 'SRV_001', status: 500, message: 'Error interno del servidor' }
};
```

**Paso 2: Usar Códigos en Controladores**

```javascript
// Archivo: backend/controllers/appointmentController.js (línea 42, reemplazar)
const ErrorCodes = require('../utils/errorCodes');

if (!isAvailable) {
  const error = ErrorCodes.APPOINTMENT_SLOT_UNAVAILABLE;
  return res.status(error.status).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: {
        doctor_id,
        requested_time: scheduled_start,
        conflicting_appointment_id: conflictingAppointment?.id
      }
    }
  });
}
```

**Paso 3: Agregar Middleware de Caché**

```javascript
// Archivo NUEVO: backend/middleware/cache.js
const cacheControl = (maxAge) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

module.exports = { cacheControl };
```

**Paso 4: Aplicar a Rutas**

```javascript
// Archivo: backend/routes/specialty.js (línea 14, modificar)
const { cacheControl } = require('../middleware/cache');

router.get('/', 
  cacheControl(3600), // 1 hora
  specialtyController.getAllSpecialties
);
```

#### 5.4. HATEOAS (Hypermedia as the Engine of Application State)

**¿Se cumple?** No Implementado (0%)

**Estado Actual:**
- ❌ Las respuestas no incluyen links a recursos relacionados.
- ❌ El cliente necesita conocer todas las URIs de antemano.

**¿Qué falta?**

HATEOAS es el nivel más avanzado de REST. Permite que el cliente navegue la API sin conocer las URIs de antemano.

**Ejemplo de Respuesta SIN HATEOAS (Actual):**

```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "specialty_id": 5
}
```

**Ejemplo de Respuesta CON HATEOAS (Ideal):**

```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "specialty_id": 5,
  "_links": {
    "self": { "href": "/api/doctors/1" },
    "specialty": { "href": "/api/specialties/5" },
    "schedules": { "href": "/api/doctors/1/schedules" },
    "appointments": { "href": "/api/doctors/1/appointments" },
    "availability": { "href": "/api/doctors/1/availability?date=2025-01-15" }
  },
  "_actions": {
    "update": { "method": "PUT", "href": "/api/doctors/1" },
    "delete": { "method": "DELETE", "href": "/api/doctors/1" },
    "deactivate": { "method": "PATCH", "href": "/api/doctors/1/status" }
  }
}
```

**¿Dónde editar?**

**Paso 1: Crear Helper de HATEOAS**

```javascript
// Archivo NUEVO: backend/utils/hateoas.js
class HATEOASBuilder {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  addResource(data, resourceType, resourceId) {
    return {
      ...data,
      _links: this.generateLinks(resourceType, resourceId, data),
      _actions: this.generateActions(resourceType, resourceId, data)
    };
  }

  generateLinks(resourceType, resourceId, data) {
    const links = {
      self: { href: `${this.baseUrl}/${resourceType}/${resourceId}` }
    };
    
    // Links específicos por tipo de recurso
    if (resourceType === 'doctors') {
      links.specialty = { href: `${this.baseUrl}/specialties/${data.specialty_id}` };
      links.schedules = { href: `${this.baseUrl}/doctors/${resourceId}/schedules` };
      links.appointments = { href: `${this.baseUrl}/doctors/${resourceId}/appointments` };
      links.availability = { href: `${this.baseUrl}/doctors/${resourceId}/availability`, templated: true };
    }
    
    if (resourceType === 'appointments') {
      links.patient = { href: `${this.baseUrl}/patients/${data.patient_user_id}` };
      links.doctor = { href: `${this.baseUrl}/doctors/${data.doctor_id}` };
      if (data.consultation_note_id) {
        links.consultation_note = { href: `${this.baseUrl}/consultation-notes/${data.consultation_note_id}` };
      }
    }
    
    return links;
  }

  generateActions(resourceType, resourceId, data) {
    const actions = {};
    
    // Acciones según estado del recurso
    if (resourceType === 'doctors' && data.active) {
      actions.update = { method: 'PUT', href: `${this.baseUrl}/doctors/${resourceId}` };
      actions.deactivate = { method: 'PATCH', href: `${this.baseUrl}/doctors/${resourceId}/status`, body: { active: false } };
    }
    
    if (resourceType === 'appointments') {
      if (data.status_code === 'scheduled') {
        actions.confirm = { method: 'PATCH', href: `${this.baseUrl}/appointments/${resourceId}/status`, body: { status: 'confirmed' } };
        actions.cancel = { method: 'DELETE', href: `${this.baseUrl}/appointments/${resourceId}` };
        actions.reschedule = { method: 'PUT', href: `${this.baseUrl}/appointments/${resourceId}/reschedule` };
      }
    }
    
    return actions;
  }

  addCollectionLinks(items, resourceType, pagination) {
    const links = {
      self: { href: `${this.baseUrl}/${resourceType}?page=${pagination.page}` }
    };
    
    if (pagination.page > 1) {
      links.prev = { href: `${this.baseUrl}/${resourceType}?page=${pagination.page - 1}` };
    }
    if (pagination.page < pagination.total_pages) {
      links.next = { href: `${this.baseUrl}/${resourceType}?page=${pagination.page + 1}` };
    }
    links.first = { href: `${this.baseUrl}/${resourceType}?page=1` };
    links.last = { href: `${this.baseUrl}/${resourceType}?page=${pagination.total_pages}` };
    
    return links;
  }
}

module.exports = HATEOASBuilder;
```

**Paso 2: Usar en Controladores**

```javascript
// Archivo: backend/controllers/doctorController.js (modificar getDoctorById)
const HATEOASBuilder = require('../utils/hateoas');

getDoctorById: async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    const hateoas = new HATEOASBuilder(process.env.API_BASE_URL || 'http://localhost:3000/api');
    const enrichedDoctor = hateoas.addResource(doctor, 'doctors', doctor.id);
    res.json(enrichedDoctor);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}
```

**Recomendación sobre HATEOAS:**
Opcional pero muy profesional. Implementar en endpoints clave: GET de recursos individuales. No necesario en todos los endpoints (overhead innecesario).

---

### Resumen de Constraint 5 (Uniform Interface)

| Sub-Constraint | Cumplimiento | Prioridad de Corrección |
|---|---|---|
| Identificación de Recursos | 70% | 🔴 ALTA |
| Manipulación mediante Representaciones | 85% | 🟡 MEDIA |
| Mensajes Auto-Descriptivos | 60% | 🔴 ALTA |
| HATEOAS | 0% | 🟢 BAJA (Opcional) |

**Acciones Críticas:**
- ✅ Reestructurar URIs (corregir anidamiento).
- ✅ Estandarizar respuestas (usar ResponseFormatter).
- ✅ Usar códigos HTTP correctos (409, 422, etc.).
- ⚠️ HATEOAS (implementar solo en recursos principales).

---

### Resumen Final de los 5 Constraints

| Constraint | Cumplimiento | Prioridad |
|---|---|---|
| 1. Client-Server | 70% | 🔴 ALTA |
| 2. Stateless | 90% | 🟡 MEDIA |
| 3. Layered System | 60% | 🔴 ALTA |
| 4. Code on Demand | 0% (Opcional) | 🟢 BAJA |
| 5. Uniform Interface | 68% | 🔴 CRÍTICA |

**Plan de Acción Inmediato:**
- Semana 1: Reestructurar Uniform Interface (URIs, códigos HTTP).
- Semana 2: Implementar Layered System (Repositorios + Servicios).
- Semana 3: Limpiar Client-Server (eliminar mock data del cliente).
- Semana 4: Ajustar Stateless (eliminar sesiones de OAuth).

---

## FASE 3: Análisis de Brechas y Expansión

### 3.1. Mejoras a URIs Actuales (Endpoints Incompletos o Mal Diseñados)

#### Problema 1: Duplicación de Ruta de Login

**URI Problemática:** `/api/auth/login` (definida en `backend/server.js:24` y `backend/routes/auth.js:98`)

**Análisis:**
- Existe lógica duplicada para autenticación.
- Riesgo de inconsistencias entre ambas implementaciones.
- Viola principio DRY (Don't Repeat Yourself).

**Impacto en Negocio:** Riesgo de Seguridad (Si actualizo validaciones en un lado y olvido el otro) y confusión en mantenimiento.

**Solución:**
- Eliminar: `server.js` líneas 24-116 (BORRAR TODA la implementación duplicada).
- Mantener: `auth.js` líneas 98-140 (Ya está bien implementado).

#### Problema 2: Anidamiento Incorrecto de Pacientes bajo Doctores

**URI Problemática:** `/api/doctors/patients` (línea 10 de `backend/routes/doctor.js`)

**Análisis:**
- Semánticamente incorrecto: Los pacientes NO son recursos hijos de doctores.
- Problema de escalabilidad: Si un paciente ve varios doctores, ¿en cuál ruta aparece?
- Violación REST: Un recurso debe tener una URI canónica.

**Impacto en Negocio:** Confusión (¿Los pacientes pertenecen a un doctor o son independientes?) y limitación funcional (Dificulta asignar un paciente a múltiples doctores).

**Diseño Actual vs Diseño Correcto:**

| Diseño Actual (❌ Incorrecto) | Diseño Correcto (✅ REST) | Nota |
|---|---|---|
| GET /api/doctors/patients | GET /api/patients?assigned_to=doctor_id | Implica propiedad vs Implica relación filtrable |

**Solución:**

**Paso 1: Mover Ruta a Patients**

```javascript
// Archivo: backend/routes/patient.js (agregar después de línea 13)
const patientManagementController = require('../controllers/patientManagementController');

// Lista de pacientes (con filtros opcionales)
router.get('/', patientManagementController.getPatientList);
```

**Paso 2: Actualizar Controlador para Soportar Filtros**

```javascript
// Archivo: backend/controllers/patientManagementController.js (modificar línea 18)
exports.getPatientList = async (req, res) => {
  try {
    const filters = {
      doctor_id: req.query.assigned_to, // Filtro opcional
      specialty_id: req.query.specialty,
      status: req.query.status
    };
    const patients = await patientService.getPatientsList(filters);
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Paso 3: Actualizar Servicio para Aplicar Filtros**

```javascript
// Archivo: backend/services/patientService.js (modificar función getPatientsList)
async function getPatientsList(filters = {}) {
  try {
    let query = supabase
      .from('users')
      .select(`
        id, first_name, last_name, email, cedula, phone_number,
        patients!inner(date_of_birth, gender, address)
      `)
      .eq('roles.name', 'patient');
    
    // Aplicar filtros dinámicamente
    if (filters.doctor_id) {
      // Filtrar por doctor asignado (requiere tabla de relaciones)
      query = query.eq('patient_doctors.doctor_id', filters.doctor_id);
    }
    if (filters.specialty) {
      query = query.eq('patient_doctors.doctors.specialty_id', filters.specialty);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(patient => ({
      id: patient.id,
      full_name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email,
      cedula: patient.cedula,
      phone: patient.phone_number,
      age: calculateAge(patient.patients.date_of_birth),
      gender: patient.patients.gender
    }));
  } catch (error) {
    throw new Error(`Error fetching patients: ${error.message}`);
  }
}
```

**Paso 4: Actualizar Cliente**

```javascript
// Archivo: js/doctorPatients.js (línea 14, modificar)
const API_BASE_URL = 'http://localhost:3000/api/patients'; // Cambiar de /doctors/patients
```

**Paso 5: Deprecar Ruta Antigua (Transición Gradual)**

```javascript
// Archivo: backend/routes/doctor.js (línea 10, comentar)
// @deprecated Use /api/patients?assigned_to=doctor_id instead
router.get('/patients', (req, res) => {
  res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Use /api/patients?assigned_to=doctor_id instead',
    migration_guide: 'https://docs.yourapi.com/migration/patients'
  });
});
```

#### Problema 3: Endpoint de Slots con Nombre Confuso

**URI Problemática:** `/api/appointments/doctors/:doctorId/available-slots` (línea 9 de `backend/routes/appointments.js`)

**Análisis:**
- Problema semántico: Los "slots" no son un recurso independiente, es un atributo computado del doctor.
- Confusión: Parece que los slots son hijos de appointments, cuando en realidad son del doctor.
- Mejor diseño: `/api/doctors/:id/availability` (representa disponibilidad del recurso doctor).

**Impacto en Negocio:** Confusión en documentación y escalabilidad.

**Solución:**

**Paso 1: Cambiar URI en Rutas**

```javascript
// Archivo: backend/routes/doctor.js (agregar después de línea 47)
router.get('/:id/availability', doctorController.getDoctorAvailability);
```

**Paso 2: Crear Nuevo Método en Controlador**

```javascript
// Archivo: backend/controllers/doctorController.js (agregar al final)
getDoctorAvailability: async (req, res) => {
  try {
    const { id } = req.params;
    const { date, range } = req.query; // date=2025-01-15 o range=week
    
    // Validar que el doctor existe
    const doctor = await doctorService.getDoctorById(id);
    
    // Obtener slots disponibles
    const slots = await availabilityService.getAvailableSlots(id, date);
    
    res.json({
      doctor: {
        id: doctor.id,
        name: `${doctor.users.first_name} ${doctor.users.last_name}`,
        specialty: doctor.specialties.name
      },
      date,
      available_slots: slots,
      _links: {
        self: { href: `/api/doctors/${id}/availability?date=${date}` },
        doctor: { href: `/api/doctors/${id}` },
        book_appointment: { href: `/api/appointments`, method: 'POST' }
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

**Paso 3: Deprecar Ruta Antigua**

```javascript
// Archivo: backend/routes/appointments.js (línea 9, modificar)
// @deprecated Use /api/doctors/:id/availability instead
router.get('/doctors/:doctorId/available-slots', (req, res) => { /* ... */ });
```

---

### 3.1 Mejoras en URIs Existentes (Resumen)

| URI Actual | Problema | URI Mejorada |
|---|---|---|
| /api/auth/login | Debería estar en sessions | /api/v1/sessions POST |
| /api/auth/register | Debería estar en patients | /api/v1/patients POST |
| /api/patients/change-password | Verbo en URL | /api/v1/patients/me/password PATCH |
| /api/appointments/:id/reschedule | Acción en URL | /api/v1/appointments/:id PATCH (con campo scheduled_start) |
| /api/patients/profile | Ambiguo | /api/v1/patients/me GET/PATCH |
| /api/medical-records | Singular incorrecto | /api/v1/patients/me/medical-record GET |

---

### 3.2 URIs Faltantes para Producto Completo

#### A. Gestión de Usuarios y Autenticación

- **POST /api/v1/sessions** - Login. Ubicación: `backend/routes/sessions.js` (crear). Por qué: Separar autenticación de recursos de usuarios.
- **DELETE /api/v1/sessions** - Logout. Ubicación: `backend/routes/sessions.js`. Por qué: Invalidar tokens (blacklist).
- **POST /api/v1/sessions/refresh** - Renovar token. Ubicación: `backend/routes/sessions.js`. Por qué: Evitar que usuarios deban re-autenticarse constantemente.
- **POST /api/v1/password-resets** - Solicitar reset de contraseña. Ubicación: `backend/routes/passwordResets.js` (crear). Por qué: Funcionalidad estándar que falta.
- **PATCH /api/v1/password-resets/:token** - Confirmar reset. Ubicación: `backend/routes/passwordResets.js`. Por qué: Completar flujo de recuperación.

#### B. Gestión de Doctores (Admin)

- **GET /api/v1/doctors** - Listar doctores (Admin). Ubicación: `backend/routes/doctors.js` (crear). Por qué: El admin necesita gestionar doctores, actualmente solo hay mock data en frontend.
- **POST /api/v1/doctors** - Crear doctor (Admin). Ubicación: `backend/routes/doctors.js`. Por qué: Falta CRUD completo.
- **GET /api/v1/doctors/:id** - Detalle de doctor. Ubicación: `backend/routes/doctors.js`. Por qué: Ver información específica.
- **PATCH /api/v1/doctors/:id** - Actualizar doctor. Ubicación: `backend/routes/doctors.js`. Por qué: Modificar datos (email, especialidad, horarios).
- **DELETE /api/v1/doctors/:id** - Eliminar doctor (Soft Delete). Ubicación: `backend/routes/doctors.js`. Por qué: Desactivar sin perder historial.

#### C. Gestión de Pacientes (Admin/Doctor)

- **GET /api/v1/patients** - Listar pacientes (Admin). Ubicación: `backend/routes/patients.js`. Por qué: Admin necesita ver todos los pacientes.
- **GET /api/v1/patients/:id** - Detalle de paciente. Ubicación: Ya existe en `patientManagementController.js:85` pero retorna 501. Por qué: Implementar para que doctores vean pacientes asignados.
- **GET /api/v1/doctors/me/patients** - Pacientes del doctor autenticado. Ubicación: `backend/routes/doctors.js`. Por qué: Doctor solo debe ver sus propios pacientes.

#### D. Gestión de Horarios y Disponibilidad

- **GET /api/v1/doctors/:id/availability** - Ver disponibilidad de un doctor. Ubicación: `backend/routes/doctors.js`. Por qué: Necesario para agendar citas.
- **PATCH /api/v1/doctors/me/availability** - Actualizar mi disponibilidad (Doctor). Ubicación: `backend/routes/doctors.js`. Por qué: Doctores deben gestionar su agenda.
- **POST /api/v1/schedules** - Crear horario (Admin). Ubicación: `backend/routes/schedules.js` (crear). Por qué: El admin debe asignar horarios a doctores.
- **GET /api/v1/schedules** - Listar horarios. Ubicación: `backend/routes/schedules.js`. Por qué: Ver todos los horarios del sistema.

#### E. Gestión de Citas (Extendido)

- **GET /api/v1/doctors/me/appointments** - Citas del doctor autenticado. Ubicación: `backend/routes/appointments.js`. Por qué: Doctores necesitan ver solo sus citas.
- **PATCH /api/v1/appointments/:id/status** - Cambiar estado de cita. Ubicación: `backend/routes/appointments.js`. Por qué: Confirmar, cancelar, marcar como completada.
- **GET /api/v1/appointments/upcoming** - Próximas citas del usuario. Ubicación: `backend/routes/appointments.js`. Por qué: Dashboard necesita solo citas futuras.

#### F. Gestión de Prescripciones

- **POST /api/v1/prescriptions** - Crear prescripción (Doctor). Ubicación: `backend/routes/prescriptions.js` (crear). Por qué: Actualmente las prescripciones están embebidas en `consultation_notes`, deben ser recursos independientes.
- **GET /api/v1/prescriptions** - Listar prescripciones del paciente. Ubicación: `backend/routes/prescriptions.js`. Por qué: Actualmente se extraen parseando texto de `patientPrescriptions.js:50`.
- **GET /api/v1/prescriptions/:id** - Detalle de prescripción. Ubicación: `backend/routes/prescriptions.js`. Por qué: Ver prescripción específica.
- **POST /api/v1/prescriptions/:id/renewals** - Solicitar renovación. Ubicación: `backend/routes/prescriptions.js`. Por qué: Botón en `patientPrescriptions.html:38` no funciona.

#### G. Gestión de Reportes de Laboratorio

- **POST /api/v1/lab-reports** - Crear reporte de laboratorio. Ubicación: `backend/routes/labReports.js` (crear). Por qué: Falta endpoint para agregar nuevos reportes.
- **GET /api/v1/lab-reports/:id/download** - Descargar PDF del reporte. Ubicación: `backend/routes/labReports.js`. Por qué: Actualmente se genera PDF solo en frontend (`patientLab.js:380`).

#### H. Gestión de Especialidades

- **POST /api/v1/specialties** - Crear especialidad (Admin). Ubicación: `backend/routes/specialties.js`. Por qué: Falta CRUD completo.
- **PATCH /api/v1/specialties/:id** - Actualizar especialidad. Ubicación: `backend/routes/specialties.js`. Por qué: Modificar nombre, descripción.
- **DELETE /api/v1/specialties/:id** - Eliminar especialidad. Ubicación: `backend/routes/specialties.js`. Por qué: Soft delete si ya no se ofrece.

#### I. Gestión de Notas de Consulta

- **POST /api/v1/consultation-notes** - Crear nota de consulta (Doctor). Ubicación: `backend/routes/consultationNotes.js` (crear). Por qué: Actualmente no hay forma de crear notas desde la UI.
- **PATCH /api/v1/consultation-notes/:id** - Actualizar nota. Ubicación: `backend/routes/consultationNotes.js`. Por qué: Corregir o agregar información.

#### J. Mensajería (Sistema de Mensajes)

- **GET /api/v1/messages** - Listar mensajes del usuario. Ubicación: `backend/routes/messages.js` (crear). Por qué: Secciones de mensajes (`patientMessages.html`, `doctorMessages.html`) tienen datos mock.
- **POST /api/v1/messages** - Enviar mensaje. Ubicación: `backend/routes/messages.js`. Por qué: Funcionalidad básica de comunicación.
- **PATCH /api/v1/messages/:id/read** - Marcar como leído. Ubicación: `backend/routes/messages.js`. Por qué: Gestión de estado de mensajes.

#### K. Notificaciones

- **GET /api/v1/notifications** - Listar notificaciones. Ubicación: `backend/routes/notifications.js` (crear). Por qué: Sistema de notificaciones existe en UI (`notificationManager.js`) pero sin backend.
- **PATCH /api/v1/notifications/:id/read** - Marcar como leída. Ubicación: `backend/routes/notifications.js`. Por qué: Actualizar estado.
- **DELETE /api/v1/notifications/:id** - Eliminar notificación. Ubicación: `backend/routes/notifications.js`. Por qué: Limpiar bandeja.

#### L. Reportes y Estadísticas

- **GET /api/v1/doctors/me/statistics** - Estadísticas del doctor. Ubicación: `backend/routes/doctors.js`. Por qué: Dashboard de doctor (`doctorHome.html:134`) muestra datos hardcodeados.
- **GET /api/v1/admin/statistics** - Estadísticas globales (Admin). Ubicación: `backend/routes/admin.js` (crear). Por qué: Dashboard admin (`DashboardAdmin.html:85`) usa datos estáticos.
- **GET /api/v1/reports/appointments** - Reporte de citas (Doctor). Ubicación: `backend/routes/reports.js` (crear). Por qué: Sección de reportes (`doctorReports.html`) existe pero sin datos reales.

#### M. Logs del Sistema (Admin)

- **GET /api/v1/logs** - Logs de auditoría (Admin). Ubicación: `backend/routes/logs.js` (crear). Por qué: Hay enlace a `AdminLogs.html` en sidebar pero sin implementación.

---

## FASE 4: Reestructuración Arquitectónica (Propuesta Final)

### Estructura de Carpetas Propuesta

```
backend/
├── routes/
│   ├── v1/
│   │   ├── index.js                    # Router principal v1
│   │   ├── sessions.js                 # Autenticación
│   │   ├── patients.js                 # CRUD Pacientes
│   │   ├── doctors.js                  # CRUD Doctores
│   │   ├── appointments.js             # CRUD Citas
│   │   ├── prescriptions.js            # CRUD Prescripciones
│   │   ├── labReports.js               # CRUD Lab Reports
│   │   ├── consultationNotes.js        # CRUD Notas
│   │   ├── specialties.js              # CRUD Especialidades
│   │   ├── schedules.js                # CRUD Horarios
│   │   ├── messages.js                 # Mensajería
│   │   ├── notifications.js            # Notificaciones
│   │   ├── passwordResets.js           # Reset password
│   │   ├── reports.js                  # Reportes/Estadísticas
│   │   ├── admin.js                    # Rutas admin
│   │   └── logs.js                     # Logs auditoría
```

### Grupo A: API de Operaciones CRUD

#### Tabla de Endpoints CRUD

| Recurso | Endpoint | Método | Descripción | Soft/Hard Delete |
|---|---|---|---|---|
| **Sessions** | /api/v1/sessions | POST | Login | N/A |
| | /api/v1/sessions | DELETE | Logout (invalidar token) | N/A |
| | /api/v1/sessions/refresh | POST | Renovar token expirado | N/A |
| **Patients** | /api/v1/patients | GET | Listar pacientes (Admin) | N/A |
| | /api/v1/patients | POST | Registrar nuevo paciente | N/A |
| | /api/v1/patients/me | GET | Perfil del paciente autenticado | N/A |
| | /api/v1/patients/me | PATCH | Actualizar mi perfil | N/A |
| | /api/v1/patients/:id | GET | Ver paciente por ID (Admin/Doctor) | N/A |
| | /api/v1/patients/:id | PATCH | Actualizar paciente (Admin) | N/A |
| | /api/v1/patients/:id | DELETE | Eliminar paciente | Soft Delete |
| **Doctors** | /api/v1/doctors | GET | Listar doctores | N/A |
| | /api/v1/doctors | POST | Crear doctor (Admin) | N/A |
| | /api/v1/doctors/me | GET | Perfil del doctor autenticado | N/A |
| | /api/v1/doctors/me | PATCH | Actualizar mi perfil (Doctor) | N/A |
| | /api/v1/doctors/:id | GET | Ver doctor por ID | N/A |
| | /api/v1/doctors/:id | PATCH | Actualizar doctor (Admin) | N/A |
| | /api/v1/doctors/:id | DELETE | Eliminar doctor | Soft Delete |
| **Appointments** | /api/v1/appointments | GET | Listar mis citas | N/A |
| | /api/v1/appointments | POST | Crear cita | N/A |
| | /api/v1/appointments/:id | GET | Ver detalle de cita | N/A |
| | /api/v1/appointments/:id | PATCH | Actualizar cita (fecha, estado) | N/A |
| | /api/v1/appointments/:id | DELETE | Cancelar cita | Soft Delete |
| **Prescriptions** | /api/v1/prescriptions | GET | Listar mis prescripciones | N/A |
| | /api/v1/prescriptions | POST | Crear prescripción (Doctor) | N/A |
| | /api/v1/prescriptions/:id | GET | Ver prescripción | N/A |
| | /api/v1/prescriptions/:id | PATCH | Actualizar prescripción (Doctor) | N/A |
| | /api/v1/prescriptions/:id | DELETE | Eliminar prescripción | Hard Delete (solo si no usada) |
| **Lab Reports** | /api/v1/lab-reports | GET | Listar mis reportes de lab | N/A |
| | /api/v1/lab-reports | POST | Crear reporte (Doctor/Lab) | N/A |
| | /api/v1/lab-reports/:id | GET | Ver reporte | N/A |
| | /api/v1/lab-reports/:id | PATCH | Actualizar reporte | N/A |
| | /api/v1/lab-reports/:id | DELETE | Eliminar reporte | Soft Delete |
| **Consultation Notes** | /api/v1/consultation-notes | GET | Listar notas de consulta | N/A |
| | /api/v1/consultation-notes | POST | Crear nota (Doctor) | N/A |
| | /api/v1/consultation-notes/:id | GET | Ver nota | N/A |
| | /api/v1/consultation-notes/:id | PATCH | Actualizar nota (Doctor) | N/A |
| | /api/v1/consultation-notes/:id | DELETE | Eliminar nota | Soft Delete |
| **Specialties** | /api/v1/specialties | GET | Listar especialidades | N/A |
| | /api/v1/specialties | POST | Crear especialidad (Admin) | N/A |
| | /api/v1/specialties/:id | GET | Ver especialidad | N/A |
| | /api/v1/specialties/:id | PATCH | Actualizar especialidad (Admin) | N/A |
| | /api/v1/specialties/:id | DELETE | Eliminar especialidad | Soft Delete |
| **Schedules** | /api/v1/schedules | GET | Listar horarios | N/A |
| | /api/v1/schedules | POST | Crear horario (Admin) | N/A |
| | /api/v1/schedules/:id | GET | Ver horario | N/A |
| | /api/v1/schedules/:id | PATCH | Actualizar horario (Admin) | N/A |
| | /api/v1/schedules/:id | DELETE | Eliminar horario | Hard Delete (si no tiene citas) |
| **Messages** | /api/v1/messages | GET | Listar mensajes | N/A |
| | /api/v1/messages | POST | Enviar mensaje | N/A |
| | /api/v1/messages/:id | GET | Ver mensaje | N/A |
| | /api/v1/messages/:id | DELETE | Eliminar mensaje | Soft Delete |
| **Notifications** | /api/v1/notifications | GET | Listar notificaciones | N/A |
| | /api/v1/notifications/:id | PATCH | Marcar como leída | N/A |
| | /api/v1/notifications/:id | DELETE | Eliminar notificación | Hard Delete |

#### Cambios en Base de Datos para Soft Delete

Agregar las siguientes columnas:

**Tabla users:**
```sql
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;

CREATE INDEX idx_users_active ON users(is_active);
```

**Tabla patients:**
```sql
ALTER TABLE patients 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

**Tabla doctors:**
```sql
ALTER TABLE doctors 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

**Tabla appointments:**
```sql
ALTER TABLE appointments 
ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD COLUMN cancellation_reason TEXT;
```

**Tabla consultation_notes:**
```sql
ALTER TABLE consultation_notes 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

**Tabla lab_reports:**
```sql
ALTER TABLE lab_reports 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

**Tabla specialties:**
```sql
ALTER TABLE specialties 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

**Tabla messages:**
```sql
ALTER TABLE messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP NULL;
```

#### Crear Middleware para Soft Delete

**Archivo:** `backend/middleware/softDelete.js`

```javascript
const supabase = require('../database');

/**
 * Middleware para implementar soft delete
 */
const softDelete = (tableName, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const id = req.params[idField];
      const { error } = await supabase
        .from(tableName)
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq(idField, id);
      if (error) throw error;
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Filtrar registros eliminados en queries GET
 */
const filterActive = (tableName) => {
  return (req, res, next) => {
    req.queryFilter = { ...req.queryFilter, is_active: true };
    next();
  };
};

module.exports = { softDelete, filterActive };
```

### Grupo B: API de Procesos y Reglas de Negocio

Estos endpoints realizan operaciones complejas que involucran múltiples recursos o lógica de negocio.

#### Tabla de Endpoints de Negocio

| Endpoint | Método | Descripción | Archivo |
|---|---|---|---|
| /api/v1/password-resets | POST | Solicitar reset de contraseña (envía email) | backend/routes/v1/passwordResets.js |
| /api/v1/password-resets/:token | PATCH | Confirmar reset con token del email | backend/routes/v1/passwordResets.js |
| /api/v1/patients/me/password | PATCH | Cambiar contraseña (requiere actual) | backend/routes/v1/patients.js |
| /api/v1/doctors/:id/availability | GET | Calcular disponibilidad en tiempo real | backend/routes/v1/doctors.js |
| /api/v1/doctors/me/availability | PATCH | Actualizar bloques de disponibilidad | backend/routes/v1/doctors.js |
| /api/v1/appointments/available-slots | POST | Obtener slots disponibles para agendar | backend/routes/v1/appointments.js |
| /api/v1/appointments/:id/confirm | POST | Confirmar cita (envía notificaciones) | backend/routes/v1/appointments.js |
| /api/v1/appointments/:id/complete | POST | Marcar cita como completada | backend/routes/v1/appointments.js |
| /api/v1/appointments/:id/no-show | POST | Marcar paciente no asistió | backend/routes/v1/appointments.js |
| /api/v1/prescriptions/:id/renewals | POST | Solicitar renovación de prescripción | backend/routes/v1/prescriptions.js |
| /api/v1/prescriptions/:id/approve-renewal | POST | Aprobar renovación (Doctor) | backend/routes/v1/prescriptions.js |
| /api/v1/lab-reports/:id/download | GET | Generar y descargar PDF del reporte | backend/routes/v1/labReports.js |
| /api/v1/medical-records/summary | GET | Generar resumen del historial médico | backend/routes/v1/medicalRecords.js |
| /api/v1/doctors/me/statistics | GET | Calcular estadísticas del doctor | backend/routes/v1/doctors.js |
| /api/v1/admin/statistics | GET | Calcular estadísticas globales del sistema | backend/routes/v1/admin.js |
| /api/v1/reports/appointments | POST | Generar reporte de citas con filtros | backend/routes/v1/reports.js |
| /api/v1/reports/export | POST | Exportar datos del sistema (CSV/Excel) | backend/routes/v1/reports.js |
| /api/v1/notifications/send | POST | Enviar notificación manual (Admin) | backend/routes/v1/notifications.js |

#### Separación en el Código

Crear Carpeta de Servicios:

```
backend/
├── services/
│   ├── authService.js          # Lógica de autenticación
│   ├── appointmentService.js   # Lógica de citas
│   ├── availabilityService.js  # Ya existe, mejorar
│   ├── prescriptionService.js  # Lógica de prescripciones
│   ├── notificationService.js  # Envío de notificaciones
│   ├── emailService.js         # Envío de emails
│   ├── pdfService.js           # Generación de PDFs
│   ├── reportService.js        # Generación de reportes
│   └── statisticsService.js    # Cálculo de estadísticas
```

**Ejemplo de Servicio:**

**Archivo:** `backend/services/appointmentService.js`

```javascript
const supabase = require('../database');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class AppointmentService {
  /**
   * Obtener slots disponibles para agendar
   */
  async getAvailableSlots(doctorId, date) {
    // 1. Obtener horario del doctor
    const { data: schedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .single();
    
    // 2. Obtener citas ya agendadas ese día
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_start, scheduled_end')
      .eq('doctor_id', doctorId)
      .gte('scheduled_start', `${date}T00:00:00`)
      .lt('scheduled_start', `${date}T23:59:59`)
      .eq('status_code', 'scheduled');
    
    // 3. Calcular slots disponibles
    const availableSlots = this.calculateSlots(schedule, appointments);
    return availableSlots;
  }

  /**
   * Confirmar cita (envía notificaciones)
   */
  async confirmAppointment(appointmentId, userId) {
    // 1. Actualizar estado
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ 
        status_code: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: userId
      })
      .eq('id', appointmentId)
      .select('*, patients(*), doctors(*)')
      .single();
    
    if (error) throw error;
    
    // 2. Enviar notificación al paciente
    await notificationService.send({
      user_id: appointment.patient_id,
      type: 'appointment_confirmed',
      title: 'Cita Confirmada',
      message: `Su cita con el Dr. ${appointment.doctors.first_name} ha sido confirmada`
    });
    
    // 3. Enviar email
    await emailService.sendAppointmentConfirmation(appointment);
    
    return appointment;
  }

  /**
   * Calcular slots disponibles (lógica privada)
   */
  calculateSlots(schedule, bookedAppointments) {
    // Implementación de lógica compleja...
    const slots = [];
    // ... código de cálculo
    return slots;
  }
}

module.exports = new AppointmentService();
```

### Grupo C: APIs de Terceros

#### Integraciones Externas

| Servicio | Propósito | Archivo de Configuración | Endpoints Afectados |
|---|---|---|---|
| Google OAuth 2.0 | Autenticación social | passport.js | /api/v1/auth/google, /api/v1/auth/google/callback |
| Supabase | Base de datos PostgreSQL | backend/database.js | Todos los endpoints |
| SendGrid / Nodemailer | Envío de emails | backend/services/emailService.js (crear) | Reset password, confirmaciones de cita |
| Twilio (opcional) | Envío de SMS | backend/services/smsService.js (crear) | Recordatorios de citas |
| Stripe (futuro) | Pagos en línea | backend/services/paymentService.js (crear) | Cobro de consultas |
| AWS S3 / Cloudinary (futuro) | Almacenamiento de archivos | backend/services/storageService.js (crear) | Subir PDFs, imágenes de perfil |

---

## FASE 5: Optimización (Cacheable)

### 5.1 Endpoints que DEBEN tener caché

| Endpoint | Tiempo de Caché | Estrategia | Archivo |
|---|---|---|---|
| GET /api/v1/specialties | 1 hora | Cache-Control + ETag | backend/routes/v1/specialties.js |
| GET /api/v1/doctors | 15 minutos | Cache-Control | backend/routes/v1/doctors.js |
| GET /api/v1/doctors/:id | 15 minutos | Cache-Control + ETag | backend/routes/v1/doctors.js |
| GET /api/v1/doctors/:id/availability | 5 minutos | Cache-Control | backend/routes/v1/doctors.js |
| GET /api/v1/patients/me | Sin caché | No cacheable (datos personales) | backend/routes/v1/patients.js |
| GET /api/v1/appointments | Sin caché | No cacheable (datos en tiempo real) | backend/routes/v1/appointments.js |

### 5.2 Implementación de Caché

#### Opción 1: Headers HTTP (Recomendado para inicio)

**Archivo:** `backend/middleware/cache.js`

```javascript
/**
 * Middleware para agregar headers de caché
 */
const cacheControl = (duration) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${duration}`);
    }
    next();
  };
};

/**
 * Middleware para ETag
 */
const etag = () => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Generar ETag basado en contenido
      const hash = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
      res.set('ETag', hash);
      
      // Verificar If-None-Match
      if (req.headers['if-none-match'] === hash) {
        return res.status(304).end();
      }
      
      originalSend.call(this, data);
    };
    next();
  };
};

module.exports = { cacheControl, etag };
```

#### Uso en Rutas

**Archivo:** `backend/routes/v1/specialties.js`

```javascript
const express = require('express');
const router = express.Router();
const { cacheControl, etag } = require('../../middleware/cache');

// GET /api/v1/specialties - Con caché de 1 hora
router.get('/', 
  cacheControl(3600),  // 1 hora = 3600 segundos
  etag(),
  async (req, res) => {
    // ... lógica del endpoint
  });

module.exports = router;
```

#### Opción 2: Redis (Para producción)

**Instalar:**

```bash
npm install redis
```

**Archivo:** `backend/config/redis.js`

```javascript
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('✅ Redis conectado'));

module.exports = client;
```

**Middleware de Redis:**

**Archivo:** `backend/middleware/redisCache.js`

```javascript
const redisClient = require('../config/redis');

const redisCache = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log('✅ Cache HIT:', key);
        return res.json(JSON.parse(cachedData));
      }
      
      console.log('❌ Cache MISS:', key);
      
      // Interceptar res.json para guardar en caché
      const originalJson = res.json;
      res.json = function(data) {
        redisClient.setEx(key, duration, JSON.stringify(data));
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Error en Redis:', error);
      next();
    }
  };
};

module.exports = redisCache;
```

**Uso:**

```javascript
const redisCache = require('../../middleware/redisCache');
```

---

**Fin del Documento**
