const coreRoutes = require('./core.routes');
const medicalRoutes = require('./medical.routes');
const operationsRoutes = require('./operations.routes');
const billingRoutes = require('./billing.routes');
const securityRoutes = require('./security.routes');
const surveysRoutes = require('./surveys.routes');

module.exports = [
  ...coreRoutes,
  ...medicalRoutes,
  ...operationsRoutes,
  ...billingRoutes,
  ...securityRoutes,
  ...surveysRoutes
];