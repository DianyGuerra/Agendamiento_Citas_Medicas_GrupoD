module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests/patients'],
  testMatch: [
    '**/crudPatient.test.js',
    '**/businessPatient.test.js'
  ],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/crud-api/routes/patient.routes.js',
    '<rootDir>/crud-api/repositories/patient.repository.js',
    '<rootDir>/business-api/services/validation.service.js',
    '<rootDir>/business-api/services/billingCalculation.service.js'
  ],
  coverageDirectory: '<rootDir>/coverage/patients',
  coverageReporters: ['text', 'lcov']
};