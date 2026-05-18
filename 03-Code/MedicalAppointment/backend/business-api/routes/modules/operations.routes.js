const availabilityRoutes = require('../availability.routes');
const schedulingRoutes = require('../scheduling.routes');
const consultationRoutes = require('../consultation.routes');

module.exports = [
  { path: '/availability', router: availabilityRoutes },
  { path: '/scheduling', router: schedulingRoutes },
  { path: '/consultations', router: consultationRoutes }
];