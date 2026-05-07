/**
 * Medical Record Routes
 * RESTful routes for medical record management
 * 
 * @module crud-api/routes/medicalRecord.routes
 */

const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecord.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/medical-records
 * @desc    Get current patient's medical record
 * @access  Patient
 */
router.get('/', requireRole('patient'), medicalRecordController.getByPatient);

/**
 * @route   GET /api/v1/medical-records/lab-reports/all
 * @desc    Get all lab reports (admin)
 * @access  Admin
 */
router.get('/lab-reports/all', requireRole(['admin']), medicalRecordController.getAllLabReports);

/**
 * @route   PATCH /api/v1/medical-records/lab-reports/:reportId/status
 * @desc    Update lab report status
 * @access  Admin
 */
router.patch('/lab-reports/:reportId/status', requireRole(['admin']), medicalRecordController.updateLabReportStatus);

/**
 * @route   POST /api/v1/medical-records/lab-reports/:reportId/results
 * @desc    Add results to a lab report
 * @access  Admin
 */
router.post('/lab-reports/:reportId/results', requireRole(['admin']), medicalRecordController.addLabReportResults);

/**
 * @route   GET /api/v1/medical-records/lab-reports
 * @desc    Get current patient's lab reports
 * @access  Patient
 */
router.get('/lab-reports', requireRole('patient'), medicalRecordController.getLabReports);

/**
 * @route   GET /api/v1/medical-records/lab-reports/appointment/:appointmentId
 * @desc    Get lab reports for a specific appointment
 * @access  Doctor, Admin
 */
router.get('/lab-reports/appointment/:appointmentId', requireRole(['doctor', 'admin']), medicalRecordController.getLabReportsByAppointment);

/**
 * @route   GET /api/v1/medical-records/lab-reports/doctor
 * @desc    Get all lab reports for doctor's patients
 * @access  Doctor
 */
router.get('/lab-reports/doctor', requireRole(['doctor']), medicalRecordController.getDoctorLabReports);

/**
 * @route   POST /api/v1/medical-records/lab-reports
 * @desc    Create lab report/order for a patient
 * @access  Doctor
 */
router.post('/lab-reports', requireRole(['doctor']), medicalRecordController.createLabReport);

/**
 * @route   PUT /api/v1/medical-records/lab-reports/:reportId/results
 * @desc    Upload results for a lab report
 * @access  Doctor
 */
router.put('/lab-reports/:reportId/results', requireRole(['doctor']), medicalRecordController.uploadLabResults);

/**
 * @route   POST /api/v1/medical-records/lab-reports/patient-upload
 * @desc    Patient uploads their own external lab results
 * @access  Patient
 */
router.post('/lab-reports/patient-upload', requireRole(['patient']), medicalRecordController.patientUploadLabReport);

/**
 * @route   PUT /api/v1/medical-records/lab-reports/:reportId/patient-results
 * @desc    Patient uploads results for their pending lab reports
 * @access  Patient
 */
router.put('/lab-reports/:reportId/patient-results', requireRole(['patient']), medicalRecordController.patientUploadResults);

/**
 * @route   GET /api/v1/medical-records/:patientId
 * @desc    Get medical record by patient ID
 * @access  Doctor, Admin
 */
router.get('/:patientId', requireRole(['doctor', 'admin']), medicalRecordController.getById);

/**
 * @route   POST /api/v1/medical-records
 * @desc    Create a medical record entry (lab orders, notes, etc.)
 * @access  Doctor
 */
router.post('/', requireRole(['doctor']), medicalRecordController.create);

/**
 * @route   PUT /api/v1/medical-records
 * @desc    Update current patient's medical record
 * @access  Patient
 */
router.put('/', requireRole('patient'), medicalRecordController.update);

/**
 * @route   PUT /api/v1/medical-records/:patientId
 * @desc    Update medical record by patient ID
 * @access  Doctor, Admin
 */
router.put('/:patientId', requireRole(['doctor', 'admin']), medicalRecordController.updateByPatient);

module.exports = router;
