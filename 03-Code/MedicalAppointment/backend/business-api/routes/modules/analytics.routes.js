const reportRoutes = require('../report.routes');
const validationRoutes = require('../validation.routes');

module.exports = [
  { path: '/reports', router: reportRoutes },
  { path: '/validations', router: validationRoutes }
];