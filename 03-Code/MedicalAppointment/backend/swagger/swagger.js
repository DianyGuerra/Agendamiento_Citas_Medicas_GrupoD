const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'Doctor & Appointment API',
    description: 'Documentación de endpoints de doctores y citas médicas',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'CRUD API (doctores y citas - operaciones básicas)'
    },
    {
      url: 'http://localhost:3002',
      description: 'Business API (lógica de negocio)'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const outputFile = './swagger/swagger-output.json';

const endpointsFiles = [
  './crud-api/server.js',
  './business-api/server.js'
];

swaggerAutogen(outputFile, endpointsFiles, doc);