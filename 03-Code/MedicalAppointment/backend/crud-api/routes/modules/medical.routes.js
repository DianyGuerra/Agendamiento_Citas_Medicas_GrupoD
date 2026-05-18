const medicalRecordRoutes = require('../medicalRecord.routes');
const consultationNoteRoutes = require('../consultationNote.routes');
const prescriptionRoutes = require('../prescription.routes');
const prescriptionRenewalRoutes = require('../prescriptionRenewal.routes');

module.exports = [
  { path: '/medical-records', router: medicalRecordRoutes },
  { path: '/consultation-notes', router: consultationNoteRoutes },
  { path: '/prescriptions', router: prescriptionRoutes },
  { path: '/prescription-renewals', router: prescriptionRenewalRoutes }
];