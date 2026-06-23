const fs = require('fs');
const path = require('path');

const swaggerDir = __dirname;
const backendRoot = path.resolve(__dirname, '..');

const inputPath = path.join(swaggerDir, 'swagger-output.json');
const swaggerOutputPath = path.join(swaggerDir, 'swagger-principal-output.json');

const postmanDir = path.join(backendRoot, 'postman');
const collectionOutputPath = path.join(postmanDir, 'MedicalAppointment_Flujos.postman_collection.json');
const environmentOutputPath = path.join(postmanDir, 'MedicalAppointment_Local.postman_environment.json');

const swagger = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const moduleConfig = [
  {
    prefix: '/api/v1/auth',
    server: '{{externalBaseUrl}}',
    description: 'External API'
  },
  {
    prefix: '/api/v1/availability',
    server: '{{businessBaseUrl}}',
    description: 'Business API'
  },
  {
    prefix: '/api/v1/scheduling',
    server: '{{businessBaseUrl}}',
    description: 'Business API'
  },
  {
    prefix: '/api/v1/appointments',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    prefix: '/api/v1/doctors',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    prefix: '/api/v1/patients',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    prefix: '/api/v1/specialties',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getModuleConfig(routePath) {
  return moduleConfig.find(config =>
    routePath === config.prefix ||
    routePath.startsWith(config.prefix + '/') ||
    routePath.startsWith(config.prefix + '{')
  );
}

function cleanOperation(operation) {
  const cleaned = JSON.parse(JSON.stringify(operation));

  const forbiddenHeaderParams = [
    'origin',
    'referer',
    'host',
    'user-agent',
    'content-length',
    'connection',
    'authorization'
  ];

  if (Array.isArray(cleaned.parameters)) {
    cleaned.parameters = cleaned.parameters.filter(param => {
      const name = String(param.name || '').toLowerCase();
      const location = String(param.in || '').toLowerCase();

      if (location === 'header' && forbiddenHeaderParams.includes(name)) {
        return false;
      }

      return true;
    });

    cleaned.parameters = cleaned.parameters.map(param => {
      if (param.in === 'path') {
        return {
          ...param,
          example: `{{${normalizeVariableName(param.name)}}}`
        };
      }

      return param;
    });
  }

  return cleaned;
}

function normalizeVariableName(name) {
  const map = {
    id: 'id',
    doctorId: 'doctorId',
    specialtyId: 'specialtyId',
    appointmentId: 'appointmentId',
    patientUserId: 'patientUserId',
    userId: 'userId',
    date: 'scheduledDate'
  };

  return map[name] || name;
}

function buildFilteredSwagger() {
  const filteredPaths = {};

  for (const [routePath, methods] of Object.entries(swagger.paths || {})) {
    const config = getModuleConfig(routePath);

    if (!config) continue;

    filteredPaths[routePath] = {};

    for (const [method, operation] of Object.entries(methods)) {
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
        {
          url: '{{crudBaseUrl}}',
          description: 'CRUD API'
        },
        {
          url: '{{businessBaseUrl}}',
          description: 'Business API'
        },
        {
          url: '{{externalBaseUrl}}',
          description: 'External API'
        }
      ]
    }
  };

  const filteredSwagger = {
    ...swagger,
    info: {
      ...swagger.info,
      title: 'Sistema de Agendamiento de Citas Médicas - Endpoints Principales',
      description: 'Documentación Swagger filtrada para módulos principales con servidores configurados mediante variables.'
    },
    servers: [
      {
        url: '{{crudBaseUrl}}',
        description: 'CRUD API'
      },
      {
        url: '{{businessBaseUrl}}',
        description: 'Business API'
      },
      {
        url: '{{externalBaseUrl}}',
        description: 'External API'
      }
    ],
    paths: filteredPaths,
    components: {
      ...(swagger.components || {}),
      securitySchemes: {
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

function bearerAuth(tokenVariable) {
  return {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: `{{${tokenVariable}}}`,
        type: 'string'
      }
    ]
  };
}

function noAuth() {
  return {
    type: 'noauth'
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
  return script.trim().split('\n');
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

function buildPostmanUrl(rawUrl) {
  const match = rawUrl.match(/^({{[^}]+}})(\/.*)?$/);

  if (!match) {
    return {
      raw: rawUrl
    };
  }

  const baseUrl = match[1];
  const pathPart = match[2] || '';

  return {
    raw: rawUrl,
    host: [baseUrl],
    path: pathPart
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean)
  };
}

function makeRequest({
  name,
  method,
  url,
  auth,
  body,
  tests,
  prerequest,
  headers
}) {
  const item = {
    name,
    request: {
      method,
      header: headers || [],
      url: buildPostmanUrl(url)
    },
    response: []
  };

  if (auth) {
    item.request.auth = auth;
  }

  if (body !== undefined && body !== null) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };

    item.request.header = jsonHeader();
  }

  const events = [];

  if (prerequest) {
    events.push(prerequestEvent(prerequest));
  }

  if (tests) {
    events.push(testEvent(tests));
  }

  if (events.length > 0) {
    item.event = events;
  }

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
    pm.expect([200, 201, 204, 400, 401, 403, 404, 409, 422]).to.include(pm.response.code);
});
`;

function tokenSaveTests(tokenVariable, userIdVariable) {
  return `
${commonTests}

const json = pm.response.json();

const token =
    json.token ||
    json.data?.token ||
    json.result?.token ||
    json.user?.token ||
    json.data?.accessToken ||
    json.accessToken;

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

const json = pm.response.json();

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

const saveSpecialtyIdTests = `
${commonTests}

const json = pm.response.json();

const data =
    Array.isArray(json.data) ? json.data :
    Array.isArray(json.specialties) ? json.specialties :
    Array.isArray(json) ? json :
    [];

if (data.length > 0) {
    pm.environment.set("specialtyId", data[0].id);
}
`;

const saveDoctorIdTests = `
${commonTests}

const json = pm.response.json();

const data =
    Array.isArray(json.data) ? json.data :
    Array.isArray(json.doctors) ? json.doctors :
    Array.isArray(json) ? json :
    [];

if (data.length > 0) {
    pm.environment.set("doctorId", data[0].id);

    if (data[0].specialty_id) {
        pm.environment.set("specialtyId", data[0].specialty_id);
    }

    if (data[0].user_id) {
        pm.environment.set("doctorUserId", data[0].user_id);
    }
}
`;

const saveDoctorProfileTests = `
${commonTests}

const json = pm.response.json();

const doctor =
    json.data?.doctor ||
    json.data ||
    json.doctor ||
    json;

if (doctor?.id) {
    pm.environment.set("doctorId", doctor.id);
}

if (doctor?.user_id) {
    pm.environment.set("doctorUserId", doctor.user_id);
}

if (doctor?.specialty_id) {
    pm.environment.set("specialtyId", doctor.specialty_id);
}
`;

const savePatientProfileTests = `
${commonTests}

const json = pm.response.json();

const patient =
    json.data?.patient ||
    json.data ||
    json.patient ||
    json;

if (patient?.id) {
    pm.environment.set("patientId", patient.id);
}

if (patient?.user_id) {
    pm.environment.set("patientUserId", patient.user_id);
}
`;

const saveFirstAvailableSlotTests = `
${commonTests}

const json = pm.response.json();

const possibleSlots =
    Array.isArray(json.data?.availableSlots) ? json.data.availableSlots :
    Array.isArray(json.data?.slots) ? json.data.slots :
    Array.isArray(json.data?.availability) ? json.data.availability :
    Array.isArray(json.availableSlots) ? json.availableSlots :
    Array.isArray(json.slots) ? json.slots :
    Array.isArray(json.availability) ? json.availability :
    Array.isArray(json.data) ? json.data :
    Array.isArray(json) ? json :
    [];

const firstAvailableSlot = possibleSlots.find(slot => {
    if (typeof slot === "string") return true;

    return (
        slot.available === true ||
        slot.isAvailable === true ||
        slot.status === "available" ||
        slot.estado === "disponible" ||
        slot.disponible === true
    );
});

pm.test("Existe al menos un horario disponible", function () {
    pm.expect(firstAvailableSlot).to.exist;
});

let selectedTime = null;
let selectedStart = null;

if (typeof firstAvailableSlot === "string") {
    selectedTime = firstAvailableSlot;
} else if (firstAvailableSlot) {
    selectedTime =
        firstAvailableSlot.time ||
        firstAvailableSlot.startTime ||
        firstAvailableSlot.start_time ||
        firstAvailableSlot.hour ||
        firstAvailableSlot.hora;

    selectedStart =
        firstAvailableSlot.scheduled_start ||
        firstAvailableSlot.scheduledStart ||
        firstAvailableSlot.start ||
        firstAvailableSlot.datetime ||
        firstAvailableSlot.dateTime;
}

if (selectedTime) {
    pm.environment.set("scheduledTime", selectedTime);
}

if (selectedStart) {
    pm.environment.set("scheduledStart", selectedStart);
} else if (selectedTime) {
    const date = pm.environment.get("scheduledDate");
    const timezoneOffset = pm.environment.get("timezoneOffset") || "-05:00";
    pm.environment.set("scheduledStart", date + "T" + selectedTime + ":00" + timezoneOffset);
}

console.log("Horario seleccionado automáticamente:", {
    scheduledDate: pm.environment.get("scheduledDate"),
    scheduledTime: pm.environment.get("scheduledTime"),
    scheduledStart: pm.environment.get("scheduledStart")
});
`;

const saveAppointmentIdTests = `
pm.test("La cita fue agendada correctamente", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("No hay error interno 500", function () {
    pm.expect(pm.response.code).to.not.equal(500);
});

pm.test("Tiempo de respuesta menor a 3000 ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

let json = {};
try {
    json = pm.response.json();
} catch (e) {
    json = {};
}

const appointment =
    json.data?.appointment ||
    json.data ||
    json.appointment ||
    json;

const appointmentId =
    appointment?.id ||
    json.appointment_id ||
    json.data?.appointment_id;

pm.test("ID de cita recibido", function () {
    pm.expect(appointmentId).to.exist;
});

if (appointmentId) {
    pm.environment.set("appointmentId", appointmentId);
}
`;

const saveAppointmentFromListTests = `
${commonTests}

const json = pm.response.json();

const data =
    Array.isArray(json.data) ? json.data :
    Array.isArray(json.appointments) ? json.appointments :
    Array.isArray(json) ? json :
    [];

if (!pm.environment.get("appointmentId") && data.length > 0) {
    pm.environment.set("appointmentId", data[0].id);
}
`;

const saveCreatedSpecialtyTests = `
${commonTests}

const json = pm.response.json();

const specialty =
    json.data?.specialty ||
    json.data ||
    json.specialty ||
    json;

const createdSpecialtyId =
    specialty?.id ||
    json.specialty_id ||
    json.data?.specialty_id;

pm.test("Especialidad creada", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
    pm.expect(createdSpecialtyId).to.exist;
});

if (createdSpecialtyId) {
    pm.environment.set("createdSpecialtyId", createdSpecialtyId);
}
`;

const createSpecialtyPreRequest = `
const suffix = Date.now().toString().slice(-6);
pm.environment.set("createdSpecialtyName", "Especialidad Test " + suffix);
pm.environment.set("updatedSpecialtyName", "Especialidad Test Actualizada " + suffix);
`;

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

function buildPatientFlow() {
  return {
    name: 'Ruta 1 - Paciente agenda cita',
    item: [
      makeRequest({
        name: '01 - Login paciente',
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
        name: '02 - Obtener usuario autenticado',
        method: 'GET',
        url: '{{externalBaseUrl}}/api/v1/auth/me',
        auth: bearerAuth('patientToken'),
        tests: authMeTests('patientUserId')
      }),
      makeRequest({
        name: '03 - Obtener mi perfil de paciente',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/patients/me',
        auth: bearerAuth('patientToken'),
        tests: savePatientProfileTests
      }),
      makeRequest({
        name: '04 - Listar especialidades',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/specialties/',
        auth: noAuth(),
        tests: saveSpecialtyIdTests
      }),
      makeRequest({
        name: '05 - Listar doctores activos',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/doctors/',
        auth: noAuth(),
        tests: saveDoctorIdTests
      }),
        makeRequest({
        name: '06 - Consultar horarios disponibles por fecha',
        method: 'GET',
        url: '{{businessBaseUrl}}/api/v1/availability/doctor/{{doctorId}}/date/{{scheduledDate}}',
        auth: noAuth(),
        tests: `
        pm.test("Consulta de disponibilidad procesada", function () {
            pm.expect(pm.response.code).to.be.oneOf([200, 204, 400, 409]);
        });

        pm.test("No hay error interno 500", function () {
            pm.expect(pm.response.code).to.not.equal(500);
        });

        pm.test("Tiempo de respuesta menor a 3000 ms", function () {
            pm.expect(pm.response.responseTime).to.be.below(3000);
        });

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
                    selectedSlot.hour;

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

            if (timeValue) {
                pm.environment.set("scheduledTime", timeValue);
            }

            if (scheduledStart) {
                pm.environment.set("scheduledStart", scheduledStart);
            }
        }

        pm.test("Horario disponible encontrado", function () {
            pm.expect(pm.environment.get("scheduledStart")).to.exist;
        });
        `
        }),
      makeRequest({
        name: '07 - Verificar disponibilidad de horario',
        method: 'POST',
        url: '{{businessBaseUrl}}/api/v1/availability/check',
        auth: noAuth(),
        body: {
          doctorId: '{{doctorId}}',
          date: '{{scheduledDate}}',
          time: '{{scheduledTime}}'
        },
        tests: commonTests
      }),
      makeRequest({
        name: '08 - Agendar una cita',
        method: 'POST',
        url: '{{businessBaseUrl}}/api/v1/scheduling/book',
        auth: bearerAuth('patientToken'),
        body: {
          doctor_id: '{{doctorId}}',
          scheduled_start: '{{scheduledStart}}',
          reason: 'Consulta general de prueba automatizada'
        },
        tests: saveAppointmentIdTests
      }),
      makeRequest({
        name: '09 - Listar mis citas como paciente',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/appointments/patient',
        auth: bearerAuth('patientToken'),
        tests: saveAppointmentFromListTests
      }),
      makeRequest({
        name: '10 - Obtener cita por ID',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/appointments/{{appointmentId}}',
        auth: bearerAuth('patientToken'),
        tests: commonTests
      })
    ]
  };
}

function buildDoctorFlow() {
  return {
    name: 'Ruta 2 - Doctor consulta citas',
    item: [
      makeRequest({
        name: '01 - Login doctor',
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
        name: '02 - Obtener usuario autenticado',
        method: 'GET',
        url: '{{externalBaseUrl}}/api/v1/auth/me',
        auth: bearerAuth('doctorToken'),
        tests: authMeTests('doctorUserId')
      }),
      makeRequest({
        name: '03 - Obtener mi perfil de doctor',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/doctors/me',
        auth: bearerAuth('doctorToken'),
        tests: saveDoctorProfileTests
      }),
      makeRequest({
        name: '04 - Listar mis citas como doctor',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/appointments/doctor',
        auth: bearerAuth('doctorToken'),
        tests: commonTests
      }),
      makeRequest({
        name: '05 - Listar mis pacientes',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/doctors/my-patients',
        auth: bearerAuth('doctorToken'),
        tests: commonTests
      })
    ]
  };
}

function buildAdminFlow() {
  return {
    name: 'Ruta 3 - Admin gestiona especialidades',
    item: [
      makeRequest({
        name: '01 - Login admin',
        method: 'POST',
        url: '{{externalBaseUrl}}/api/v1/auth/login',
        auth: noAuth(),
        body: {
          email: '{{adminEmail}}',
          password: '{{adminPassword}}'
        },
        tests: tokenSaveTests('adminToken', 'adminUserId')
      }),
      makeRequest({
        name: '02 - Obtener usuario autenticado',
        method: 'GET',
        url: '{{externalBaseUrl}}/api/v1/auth/me',
        auth: bearerAuth('adminToken'),
        tests: authMeTests('adminUserId')
      }),
      makeRequest({
        name: '03 - Listar especialidades',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/specialties/',
        auth: noAuth(),
        tests: saveSpecialtyIdTests
      }),
      makeRequest({
        name: '04 - Obtener estadísticas de especialidades',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/specialties/stats',
        auth: noAuth(),
        tests: commonTests
      }),
      makeRequest({
        name: '05 - Crear especialidad de prueba',
        method: 'POST',
        url: '{{crudBaseUrl}}/api/v1/specialties/',
        auth: bearerAuth('adminToken'),
        prerequest: createSpecialtyPreRequest,
        body: {
          name: '{{createdSpecialtyName}}',
          description: 'Especialidad creada durante pruebas automatizadas en Postman',
          consultation_fee: 45.5
        },
        tests: saveCreatedSpecialtyTests
      }),
      makeRequest({
        name: '06 - Consultar especialidad creada',
        method: 'GET',
        url: '{{crudBaseUrl}}/api/v1/specialties/{{createdSpecialtyId}}',
        auth: noAuth(),
        tests: commonTests
      }),
      makeRequest({
        name: '07 - Actualizar especialidad creada',
        method: 'PUT',
        url: '{{crudBaseUrl}}/api/v1/specialties/{{createdSpecialtyId}}',
        auth: bearerAuth('adminToken'),
        body: {
          name: '{{updatedSpecialtyName}}',
          description: 'Especialidad actualizada durante pruebas automatizadas en Postman',
          consultation_fee: 50
        },
        tests: commonTests
      }),
      makeRequest({
        name: '08 - Eliminar especialidad creada',
        method: 'DELETE',
        url: '{{crudBaseUrl}}/api/v1/specialties/{{createdSpecialtyId}}',
        auth: bearerAuth('adminToken'),
        tests: commonTests
      })
    ]
  };
}

function buildPostmanCollection() {
  const collection = {
    info: {
      name: 'MedicalAppointment - Flujos Automatizados',
      description: 'Colección generada automáticamente para ejecutar flujos funcionales principales del sistema de agendamiento de citas médicas.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [
      buildHealthFolder(),
      buildPatientFlow(),
      buildDoctorFlow(),
      buildAdminFlow()
    ],
    event: [
      testEvent(commonTests)
    ],
    variable: []
  };

  fs.writeFileSync(collectionOutputPath, JSON.stringify(collection, null, 2), 'utf8');
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
      { key: 'doctorId', value: '', type: 'default', enabled: true },
      { key: 'doctorUserId', value: '', type: 'default', enabled: true },

      { key: 'adminEmail', value: 'admin@clinica.com', type: 'default', enabled: true },
      { key: 'adminPassword', value: 'admin123', type: 'secret', enabled: true },
      { key: 'adminToken', value: '', type: 'secret', enabled: true },
      { key: 'adminUserId', value: '', type: 'default', enabled: true },

      { key: 'specialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyName', value: '', type: 'default', enabled: true },
      { key: 'updatedSpecialtyName', value: '', type: 'default', enabled: true },

      { key: 'appointmentId', value: '', type: 'default', enabled: true },
      
      { key: 'scheduledDate', value: '2026-07-01', type: 'default', enabled: true },
      { key: 'scheduledTime', value: '09:30', type: 'default', enabled: true },
      { key: 'timezoneOffset', value: '-05:00', type: 'default', enabled: true },
      { key: 'scheduledStart', value: '2026-07-01T09:30:00-05:00', type: 'default', enabled: true }
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_using: 'ChatGPT'
  };

  fs.writeFileSync(environmentOutputPath, JSON.stringify(environment, null, 2), 'utf8');
}

function main() {
  ensureDir(postmanDir);

  const filteredSwagger = buildFilteredSwagger();
  buildPostmanCollection();
  buildPostmanEnvironment();

  let operationCount = 0;

  for (const methods of Object.values(filteredSwagger.paths)) {
    operationCount += Object.keys(methods).length;
  }

  console.log('Archivos generados correctamente.');
  console.log(`Swagger principal: ${swaggerOutputPath}`);
  console.log(`Colección Postman: ${collectionOutputPath}`);
  console.log(`Environment Postman: ${environmentOutputPath}`);
  console.log(`Paths incluidos en Swagger: ${Object.keys(filteredSwagger.paths).length}`);
  console.log(`Operaciones HTTP incluidas en Swagger: ${operationCount}`);
  console.log('Flujos Postman incluidos:');
  console.log('- 00 - Health checks');
  console.log('- Ruta 1 - Paciente agenda cita');
  console.log('- Ruta 2 - Doctor consulta citas');
  console.log('- Ruta 3 - Admin gestiona especialidades');
}

main();