module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests/appointment'],
  testMatch: [
    '**/crudAppointment.test.js',
    '**/businessApp.test.js',
    '**/externalAppointment.test.js'
  ],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/crud-api/routes/appointment.routes.js',
    '<rootDir>/crud-api/controllers/appointment.controller.js',
    '<rootDir>/business-api/controllers/scheduling.controller.js',
    '<rootDir>/external-api/services/reminder.service.js'
  ],
  coverageDirectory: '<rootDir>/coverage/appointment',
  coverageReporters: ['text', 'lcov']
};
