const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'swagger-output.json');
const outputPath = path.join(__dirname, 'swagger-principal-output.json');

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

const excludedPostmanHeaders = new Set([
  'origin',
  'referer',
  'host',
  'user-agent',
  'content-length',
  'connection'
]);

const postmanServers = {
  crud: {
    url: '{{crudBaseUrl}}',
    description: 'CRUD API'
  },
  business: {
    url: '{{businessBaseUrl}}',
    description: 'Business API'
  },
  external: {
    url: '{{externalBaseUrl}}',
    description: 'External API'
  }
};

const moduleConfig = [
  {
    name: 'Auth',
    prefix: '/api/v1/auth',
    server: postmanServers.external
  },
  {
    name: 'Availability',
    prefix: '/api/v1/availability',
    server: postmanServers.business
  },
  {
    name: 'Scheduling',
    prefix: '/api/v1/scheduling',
    server: postmanServers.business
  },
  {
    name: 'Appointments',
    prefix: '/api/v1/appointments',
    server: postmanServers.crud
  },
  {
    name: 'Doctors',
    prefix: '/api/v1/doctors',
    server: postmanServers.crud
  },
  {
    name: 'Patients',
    prefix: '/api/v1/patients',
    server: postmanServers.crud
  },
  {
    name: 'Specialties',
    prefix: '/api/v1/specialties',
    server: postmanServers.crud
  }
];

const healthConfig = {
  path: '/health',
  name: 'Health',
  servers: [
    postmanServers.crud,
    postmanServers.business,
    postmanServers.external
  ]
};

function getModuleConfig(routePath) {
  return moduleConfig.find(config =>
    routePath === config.prefix ||
    routePath.startsWith(config.prefix + '/') ||
    routePath.startsWith(config.prefix + '{')
  );
}

function removeExcludedHeaderParameters(operation) {
  if (!Array.isArray(operation.parameters)) {
    return operation;
  }

  return {
    ...operation,
    parameters: operation.parameters.filter(parameter => {
      const location = parameter?.in?.toLowerCase();
      const name = parameter?.name?.toLowerCase();

      return location !== 'header' || !excludedPostmanHeaders.has(name);
    })
  };
}

function assignServers(pathItem, servers) {
  const result = {};

  for (const [key, value] of Object.entries(pathItem)) {
    if (!httpMethods.has(key.toLowerCase())) {
      result[key] = value;
      continue;
    }

    const operation = removeExcludedHeaderParameters(value);

    result[key] = {
      ...operation,
      servers: servers.map(server => ({ ...server }))
    };
  }

  return result;
}

const filteredPaths = {};
const includedModules = new Set();

for (const [routePath, methods] of Object.entries(swagger.paths || {})) {
  if (routePath === healthConfig.path) continue;

  const config = getModuleConfig(routePath);

  if (!config) continue;

  filteredPaths[routePath] = assignServers(methods, [config.server]);
  includedModules.add(config.name);
}

const healthPathItem = swagger.paths?.[healthConfig.path];

if (healthPathItem?.get) {
  filteredPaths[healthConfig.path] = assignServers(
    healthPathItem,
    healthConfig.servers
  );
  includedModules.add(healthConfig.name);
}

const filteredSwagger = {
  ...swagger,
  info: {
    ...swagger.info,
    title: 'Sistema de Agendamiento de Citas Médicas - Endpoints Principales',
    description: 'Documentación Swagger filtrada para módulos principales con servidor asignado por endpoint.'
  },
  servers: Object.values(postmanServers).map(server => ({ ...server })),
  paths: filteredPaths
};

let operationCount = 0;

for (const methods of Object.values(filteredPaths)) {
  operationCount += Object.keys(methods)
    .filter(method => httpMethods.has(method.toLowerCase()))
    .length;
}

fs.writeFileSync(outputPath, JSON.stringify(filteredSwagger, null, 2), 'utf8');

console.log(`Archivo generado: ${outputPath}`);
console.log(`Paths incluidos: ${Object.keys(filteredPaths).length}`);
console.log(`Operaciones HTTP incluidas: ${operationCount}`);
console.log(`Modulos incluidos: ${includedModules.size} (${[...includedModules].join(', ')})`);
