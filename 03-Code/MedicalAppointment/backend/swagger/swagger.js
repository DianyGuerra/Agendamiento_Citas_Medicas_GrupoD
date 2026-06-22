constswaggerAutogen=require('swagger-autogen')({ openapi:'3.0.0' });

constdoc= {
  info: {
    title:'Sistema de Agendamiento de Citas Médicas',
    description:'Documentación automática de endpoints del backend',
    version:'1.0.0'
  },
  servers: [
    {
      url:'http://localhost:3001',
      description:'CRUD API'
    },
    {
      url:'http://localhost:3002',
      description:'Business API'
    },
    {
      url:'http://localhost:3003',
      description:'External API'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:'http',
        scheme:'bearer',
        bearerFormat:'JWT'
      }
    }
  }
};

constoutputFile='./swagger/swagger-output.json';

constendpointsFiles= [
'./crud-api/server.js',
'./business-api/server.js',
'./external-api/server.js'
];

swaggerAutogen(outputFile,endpointsFiles,doc);