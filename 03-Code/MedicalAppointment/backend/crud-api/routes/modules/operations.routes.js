const consultationRoomRoutes = require('../consultationRoom.routes');
const waitingListRoutes = require('../waitingList.routes');
const doctorRatingRoutes = require('../doctorRating.routes');
const medicalServiceRoutes = require('../medicalService.routes');

module.exports = [
  { path: '/consultation-rooms', router: consultationRoomRoutes },
  { path: '/waiting-list', router: waitingListRoutes },
  { path: '/doctor-ratings', router: doctorRatingRoutes },
  { path: '/medical-services', router: medicalServiceRoutes }
];