const operationsRoutes = require('./operations.routes');
const financeRoutes = require('./finance.routes');
const analyticsRoutes = require('./analytics.routes');

module.exports = [
  ...operationsRoutes,
  ...financeRoutes,
  ...analyticsRoutes
];