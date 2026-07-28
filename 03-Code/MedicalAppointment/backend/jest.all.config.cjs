module.exports = {
  projects: [
    '<rootDir>/jest.appointment.config.cjs',
    '<rootDir>/jest.doctor.config.cjs',
    '<rootDir>/jest.patient.config.cjs'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/all',
  coverageReporters: ['text', 'lcov', 'html'],
  // Union of the collectCoverageFrom lists in jest.appointment/doctor/patient.config.cjs.
  // Without this, combined "projects" runs report coverage for every file any test
  // happens to require (mocks, shared error classes, etc.), not just the target files.
  collectCoverageFrom: [
    '<rootDir>/crud-api/routes/appointment.routes.js',
    '<rootDir>/crud-api/controllers/appointment.controller.js',
    '<rootDir>/business-api/controllers/scheduling.controller.js',
    '<rootDir>/external-api/services/reminder.service.js',
    '<rootDir>/business-api/controllers/availability.controller.js',
    '<rootDir>/business-api/routes/availability.routes.js',
    '<rootDir>/business-api/services/availability.service.js',
    '<rootDir>/crud-api/controllers/doctor.controller.js',
    '<rootDir>/crud-api/repositories/doctor.repository.js',
    '<rootDir>/crud-api/routes/doctor.routes.js',
    '<rootDir>/crud-api/routes/patient.routes.js',
    '<rootDir>/crud-api/controllers/patient.controller.js',
    '<rootDir>/crud-api/repositories/patient.repository.js',
    '<rootDir>/business-api/services/validation.service.js',
    '<rootDir>/business-api/services/billingCalculation.service.js'
  ],
  coverageThreshold: {
  global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100
  }
}
};
