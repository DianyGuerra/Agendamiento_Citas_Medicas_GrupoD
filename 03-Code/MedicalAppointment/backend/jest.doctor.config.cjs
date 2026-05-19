module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests/doctors'],
  testMatch: [
    '**/crudDoctor.test.js',
    '**/businessDoctor.test.js'
  ],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/crud-api/routes/doctor.routes.js',
    '<rootDir>/crud-api/controllers/doctor.controller.js',
    '<rootDir>/crud-api/repositories/doctor.repository.js',
    '<rootDir>/business-api/controllers/availability.controller.js',
    '<rootDir>/business-api/services/availability.service.js',
    '<rootDir>/business-api/routes/availability.routes.js'
  ],
  coverageDirectory: '<rootDir>/coverage/doctor',
  coverageReporters: ['text', 'lcov']
};