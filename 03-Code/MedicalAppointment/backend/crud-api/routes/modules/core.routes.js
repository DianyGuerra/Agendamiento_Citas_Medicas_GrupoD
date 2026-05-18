const userRoutes = require('../user.routes');
const patientRoutes = require('../patient.routes');
const doctorRoutes = require('../doctor.routes');
const appointmentRoutes = require('../appointment.routes');
const specialtyRoutes = require('../specialty.routes');
const scheduleRoutes = require('../schedule.routes');

module.exports = [
  { path: '/users', router: userRoutes },
  { path: '/patients', router: patientRoutes },
  { path: '/doctors', router: doctorRoutes },
  { path: '/appointments', router: appointmentRoutes },
  { path: '/specialties', router: specialtyRoutes },
  { path: '/schedules', router: scheduleRoutes }
];