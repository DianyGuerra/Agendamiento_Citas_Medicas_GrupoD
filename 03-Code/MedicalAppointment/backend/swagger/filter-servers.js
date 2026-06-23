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

const moduleConfig = [
  {
    name: 'Auth',
    prefix: '/api/v1/auth',
    server: '{{externalBaseUrl}}',
    description: 'External API'
  },
  {
    name: 'Users',
    prefix: '/api/v1/users',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    name: 'Availability',
    prefix: '/api/v1/availability',
    server: '{{businessBaseUrl}}',
    description: 'Business API'
  },
  {
    name: 'Scheduling',
    prefix: '/api/v1/scheduling',
    server: '{{businessBaseUrl}}',
    description: 'Business API'
  },
  {
    name: 'Appointments',
    prefix: '/api/v1/appointments',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    name: 'Doctors',
    prefix: '/api/v1/doctors',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    name: 'Patients',
    prefix: '/api/v1/patients',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  {
    name: 'Specialties',
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
  if (routePath === '/health') {
    return {
      name: 'Health',
      prefix: '/health',
      server: '{{crudBaseUrl}}',
      description: 'Health'
    };
  }

  const config = moduleConfig.find(item =>
    routePath === item.prefix ||
    routePath.startsWith(item.prefix + '/') ||
    routePath.startsWith(item.prefix + '{')
  );

  if (config) return config;

  return {
    name: 'Otros',
    prefix: '/',
    server: '{{crudBaseUrl}}',
    description: 'CRUD API'
  };
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

function cleanOperation(operation) {
  const cleaned = JSON.parse(JSON.stringify(operation || {}));

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
  }

  return cleaned;
}

function normalizeKey(value) {
  return String(value || '')
    .replace(/[-_]/g, '')
    .toLowerCase();
}

function normalizeVariableName(name, routePath = '') {
  const normalized = normalizeKey(name);

  const map = {
    id: inferIdVariableByRoute(routePath),
    doctor: 'doctorId',
    doctorid: 'doctorId',
    patient: 'patientId',
    patientid: 'patientId',
    paciente: 'patientId',
    pacienteid: 'patientId',
    specialty: 'specialtyId',
    specialtyid: 'specialtyId',
    speciality: 'specialtyId',
    specialityid: 'specialtyId',
    appointment: 'appointmentId',
    appointmentid: 'appointmentId',
    cita: 'appointmentId',
    citaid: 'appointmentId',
    user: 'userId',
    userid: 'userId',
    usuario: 'userId',
    usuarioid: 'userId',
    date: 'scheduledDate',
    fecha: 'scheduledDate',
    time: 'scheduledTime',
    hora: 'scheduledTime',
    scheduleddate: 'scheduledDate',
    scheduledtime: 'scheduledTime',
    scheduledstart: 'scheduledStart',
    startdate: 'startDate',
    enddate: 'endDate',
    page: 'page',
    limit: 'limit',
    search: 'search',
    status: 'status',
    estado: 'status',
    role: 'role',
    rol: 'role',
    email: 'adminEmail',
    token: 'adminToken'
  };

  return map[normalized] || String(name || 'value');
}

function inferIdVariableByRoute(routePath) {
  if (routePath.includes('/doctors')) return 'doctorId';
  if (routePath.includes('/patients')) return 'patientId';
  if (routePath.includes('/specialties')) return 'specialtyId';
  if (routePath.includes('/appointments')) return 'appointmentId';
  if (routePath.includes('/users')) return 'userId';
  if (routePath.includes('/auth')) return 'userId';
  return 'id';
}

function replacePathParams(routePath) {
  return routePath.replace(/{([^}]+)}/g, (_, paramName) => {
    return '{{' + normalizeVariableName(paramName, routePath) + '}}';
  });
}

function getQueryParams(operation) {
  if (!Array.isArray(operation.parameters)) return [];

  return operation.parameters.filter(param => {
    return String(param.in || '').toLowerCase() === 'query';
  });
}

function buildUrl(routePath, config, operation) {
  const pathWithVariables = replacePathParams(routePath);
  let raw = config.server + pathWithVariables;

  const queryParams = getQueryParams(operation);

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

  if (!match) {
    return {
      raw: rawUrl
    };
  }

  const baseUrl = match[1];
  const pathPart = match[2] || '';

  const url = {
    raw: rawUrl,
    host: [baseUrl],
    path: pathPart
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean)
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
      method: method.toUpperCase(),
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

if (userId) {
    pm.environment.set("userId", userId);
}

const patientId =
    json.patient?.id ||
    json.data?.patient?.id ||
    data?.patient?.id ||
    firstItem?.patient_id ||
    firstItem?.patientId ||
    (requestName.includes("patient") || requestName.includes("paciente") ? firstItem?.id : null);

if (patientId) {
    pm.environment.set("patientId", patientId);
}

const doctorId =
    json.doctor?.id ||
    json.data?.doctor?.id ||
    data?.doctor?.id ||
    firstItem?.doctor_id ||
    firstItem?.doctorId ||
    (requestName.includes("doctor") ? firstItem?.id : null);

if (doctorId) {
    pm.environment.set("doctorId", doctorId);
}

const specialtyId =
    json.specialty?.id ||
    json.data?.specialty?.id ||
    data?.specialty?.id ||
    firstItem?.specialty_id ||
    firstItem?.specialtyId ||
    firstItem?.speciality_id ||
    firstItem?.specialityId ||
    (requestName.includes("specialt") || requestName.includes("especialidad") ? firstItem?.id : null);

if (specialtyId) {
    pm.environment.set("specialtyId", specialtyId);
}

const createdSpecialtyId =
    json.specialty?.id ||
    json.data?.specialty?.id ||
    data?.specialty?.id ||
    json.specialty_id ||
    json.data?.specialty_id ||
    (requestName.includes("crear") && requestName.includes("specialt") ? firstItem?.id : null) ||
    (requestName.includes("post") && requestName.includes("specialt") ? firstItem?.id : null);

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

if (appointmentId) {
    pm.environment.set("appointmentId", appointmentId);
}
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

    if (timeValue) {
        pm.environment.set("scheduledTime", timeValue);
    }

    if (scheduledStart) {
        pm.environment.set("scheduledStart", scheduledStart);
    }
}

pm.test("Horario disponible encontrado o respuesta controlada", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 204, 400, 409]);
});
`;

const createSpecialtyPreRequest = `
const suffix = Date.now().toString().slice(-6);
pm.environment.set("createdSpecialtyName", "Especialidad Test " + suffix);
pm.environment.set("updatedSpecialtyName", "Especialidad Test Actualizada " + suffix);
pm.environment.set("testName", "Registro Test " + suffix);
`;

function isLoginEndpoint(routePath, method) {
  return method.toLowerCase() === 'post' && /\/api\/v1\/auth\/login\/?$/.test(routePath);
}

function isAuthMeEndpoint(routePath, method) {
  return method.toLowerCase() === 'get' && /\/api\/v1\/auth\/me\/?$/.test(routePath);
}

function isHealthEndpoint(routePath) {
  return routePath === '/health';
}

function inferTokenVariable(routePath, method) {
  const lowerPath = routePath.toLowerCase();
  const lowerMethod = method.toLowerCase();

  if (isHealthEndpoint(routePath)) return null;
  if (isLoginEndpoint(routePath, method)) return null;

  if (lowerPath.includes('/patients/me')) return 'patientToken';
  if (lowerPath.includes('/appointments/patient')) return 'patientToken';
  if (lowerPath.includes('/scheduling/book')) return 'patientToken';

  if (lowerPath.includes('/doctors/me')) return 'doctorToken';
  if (lowerPath.includes('/appointments/doctor')) return 'doctorToken';
  if (lowerPath.includes('/doctors/my-patients')) return 'doctorToken';
  if (lowerPath.includes('/scheduling/statistics/doctor')) return 'doctorToken';

  if (['post', 'put', 'patch', 'delete'].includes(lowerMethod)) return 'adminToken';

  if (lowerPath.includes('/users')) return 'adminToken';

  return null;
}

function inferTests(routePath, method) {
  const lowerPath = routePath.toLowerCase();

  if (isLoginEndpoint(routePath, method)) {
    return saveIdsTests;
  }

  if (lowerPath.includes('/availability/doctor/') && lowerPath.includes('/date/')) {
    return saveAvailableSlotTests;
  }

  return saveIdsTests;
}

function resolveSchema(schema) {
  if (!schema) return null;

  if (schema.$ref) {
    const refPath = schema.$ref.replace(/^#\//, '').split('/');
    let current = swagger;

    for (const segment of refPath) {
      current = current?.[segment];
    }

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
  const type = schemaType(schema);

  if (schema?.enum?.length > 0) {
    return schema.enum[0];
  }

  if (schema?.example !== undefined) {
    const example = schema.example;

    if (
      example !== 'string' &&
      example !== 'String' &&
      example !== 0 &&
      example !== null
    ) {
      return example;
    }
  }

  if (name.includes('email')) {
    if (isLoginEndpoint(routePath, method)) return '{{adminEmail}}';
    return 'test@example.com';
  }

  if (name.includes('password') || name.includes('clave')) {
    if (isLoginEndpoint(routePath, method)) return '{{adminPassword}}';
    return '{{adminPassword}}';
  }

  if (name === 'doctorid' || name === 'doctorid' || name.includes('doctor')) return '{{doctorId}}';
  if (name === 'patientid' || name.includes('patient') || name.includes('paciente')) return '{{patientId}}';
  if (name === 'specialtyid' || name.includes('specialty') || name.includes('speciality') || name.includes('especialidad')) return '{{specialtyId}}';
  if (name === 'appointmentid' || name.includes('appointment') || name.includes('cita')) return '{{appointmentId}}';
  if (name === 'userid' || name.includes('userid')) return '{{userId}}';

  if (name.includes('scheduledstart') || name.includes('scheduled_start')) return '{{scheduledStart}}';
  if (name === 'date' || name.includes('fecha')) return '{{scheduledDate}}';
  if (name === 'time' || name.includes('hora')) return '{{scheduledTime}}';
  if (name.includes('startdate') || name.includes('start_date')) return '{{startDate}}';
  if (name.includes('enddate') || name.includes('end_date')) return '{{endDate}}';

  if (name === 'name' || name === 'nombre') {
    if (routePath.includes('/specialties')) return '{{createdSpecialtyName}}';
    return '{{testName}}';
  }

  if (name.includes('description') || name.includes('descripcion')) return 'Dato generado automáticamente desde Postman';
  if (name.includes('reason') || name.includes('motivo')) return 'Consulta general de prueba automatizada';
  if (name.includes('phone') || name.includes('telefono')) return '0999999999';
  if (name.includes('role') || name.includes('rol')) return '{{role}}';
  if (name.includes('status') || name.includes('estado')) return '{{status}}';

  if (name.includes('fee') || name.includes('price') || name.includes('cost') || name.includes('amount') || name.includes('monto')) return 50;
  if (name.includes('duration') || name.includes('minutes') || name.includes('minutos')) return 30;
  if (name.includes('age') || name.includes('edad')) return 30;

  if (type === 'integer' || type === 'number') return 1;
  if (type === 'boolean') return true;
  if (type === 'array') return [];
  if (type === 'object') return {};

  return 'valor-prueba';
}

function buildBodyFromSchema(schema, routePath, method) {
  const resolved = resolveSchema(schema);

  if (!resolved) return null;

  if (resolved.example) return resolved.example;

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

function buildBodyFromSwagger2Parameters(operation, routePath, method) {
  if (!Array.isArray(operation.parameters)) return null;

  const bodyParam = operation.parameters.find(param => {
    return String(param.in || '').toLowerCase() === 'body';
  });

  if (!bodyParam) return null;

  return buildBodyFromSchema(bodyParam.schema, routePath, method);
}

function buildBodyFromOpenApi3RequestBody(operation, routePath, method) {
  const content = operation.requestBody?.content || {};
  const jsonContent =
    content['application/json'] ||
    content['application/*+json'] ||
    Object.values(content).find(value => value?.schema);

  if (!jsonContent) return null;

  if (jsonContent.example) return jsonContent.example;

  if (jsonContent.examples) {
    const firstExample = Object.values(jsonContent.examples)[0];
    if (firstExample?.value) return firstExample.value;
  }

  return buildBodyFromSchema(jsonContent.schema, routePath, method);
}

function buildRequestBody(operation, routePath, method) {
  if (isLoginEndpoint(routePath, method)) {
    return {
      email: '{{adminEmail}}',
      password: '{{adminPassword}}'
    };
  }

  const fromOpenApi3 = buildBodyFromOpenApi3RequestBody(operation, routePath, method);
  if (fromOpenApi3) return fromOpenApi3;

  const fromSwagger2 = buildBodyFromSwagger2Parameters(operation, routePath, method);
  if (fromSwagger2) return fromSwagger2;

  return null;
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
      title: 'Sistema de Agendamiento de Citas Médicas - Todos los Endpoints',
      description: 'Documentación Swagger filtrada para todos los endpoints principales con servidores configurados mediante variables.'
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

function requestName(method, routePath, operation) {
  const summary = operation.summary || operation.description;

  if (summary) {
    return method.toUpperCase() + ' - ' + summary;
  }

  return method.toUpperCase() + ' - ' + routePath;
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

      const body = ['post', 'put', 'patch'].includes(method.toLowerCase())
        ? buildRequestBody(operation, routePath, method)
        : null;

      const prerequest = ['post', 'put', 'patch'].includes(method.toLowerCase())
        ? createSpecialtyPreRequest
        : null;

      let tests = inferTests(routePath, method);

      if (isAuthMeEndpoint(routePath, method)) {
        const tokenForMe = tokenVariable || 'adminToken';
        if (tokenForMe === 'patientToken') tests = authMeTests('patientUserId');
        else if (tokenForMe === 'doctorToken') tests = authMeTests('doctorUserId');
        else tests = authMeTests('adminUserId');
      }

      folder.item.push(makeRequest({
        name: requestName(method, routePath, operation),
        method,
        url,
        auth: tokenVariable ? bearerAuth(tokenVariable) : noAuth(),
        body,
        prerequest,
        tests
      }));
    }
  }

  const collection = {
    info: {
      name: 'MedicalAppointment - Todos los Endpoints',
      description: 'Colección generada automáticamente desde swagger-output.json. Incluye todos los endpoints detectados, variables de entorno, autenticación por rol y scripts para guardar IDs.',
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
      { key: 'doctorId', value: '', type: 'default', enabled: true },
      { key: 'doctorUserId', value: '', type: 'default', enabled: true },

      { key: 'adminEmail', value: 'admin@clinica.com', type: 'default', enabled: true },
      { key: 'adminPassword', value: 'admin123', type: 'secret', enabled: true },
      { key: 'adminToken', value: '', type: 'secret', enabled: true },
      { key: 'adminUserId', value: '', type: 'default', enabled: true },

      { key: 'userId', value: '', type: 'default', enabled: true },
      { key: 'specialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyId', value: '', type: 'default', enabled: true },
      { key: 'createdSpecialtyName', value: '', type: 'default', enabled: true },
      { key: 'updatedSpecialtyName', value: '', type: 'default', enabled: true },

      { key: 'appointmentId', value: '', type: 'default', enabled: true },

      { key: 'scheduledDate', value: '2026-07-01', type: 'default', enabled: true },
      { key: 'scheduledTime', value: '09:30', type: 'default', enabled: true },
      { key: 'timezoneOffset', value: '-05:00', type: 'default', enabled: true },
      { key: 'scheduledStart', value: '2026-07-01T09:30:00-05:00', type: 'default', enabled: true },

      { key: 'startDate', value: '2026-07-01', type: 'default', enabled: true },
      { key: 'endDate', value: '2026-07-31', type: 'default', enabled: true },
      { key: 'page', value: '1', type: 'default', enabled: true },
      { key: 'limit', value: '10', type: 'default', enabled: true },
      { key: 'search', value: '', type: 'default', enabled: true },
      { key: 'status', value: 'scheduled', type: 'default', enabled: true },
      { key: 'role', value: 'admin', type: 'default', enabled: true },
      { key: 'testName', value: '', type: 'default', enabled: true },
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
  console.log('Colección generada con todos los endpoints detectados.');
}

main();