/**
 * QR Code Routes
 * @module external-api/routes/qrCode.routes
 */

const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCode.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// ===== PUBLIC ROUTES (no auth required) =====

/**
 * @route GET /qr-codes/verify-prescription/:token
 * @desc Verify prescription by QR token (public endpoint for pharmacies/patients)
 * @access Public
 */
router.get(
  '/verify-prescription/:token',
  qrCodeController.verifyPrescriptionByToken
);

// ===== PROTECTED ROUTES =====
// All routes below require authentication
router.use(authMiddleware);

/**
 * @route POST /qr-codes/prescription/:prescriptionId
 * @desc Generate QR code for a prescription
 * @access Admin, Doctor
 */
router.post(
  '/prescription/:prescriptionId',
  requireRole('admin', 'doctor'),
  qrCodeController.generatePrescriptionQR
);

/**
 * @route POST /qr-codes/appointment/:appointmentId
 * @desc Generate QR code for an appointment
 * @access Admin, Doctor, Patient
 */
router.post(
  '/appointment/:appointmentId',
  qrCodeController.generateAppointmentQR
);

/**
 * @route POST /qr-codes/patient/check-in
 * @desc Generate patient check-in QR
 * @access Patient
 */
router.post(
  '/patient/check-in',
  requireRole('patient'),
  qrCodeController.generatePatientCheckInQR
);

/**
 * @route POST /qr-codes/verify
 * @desc Verify QR code content
 * @access Admin, Doctor
 */
router.post(
  '/verify',
  requireRole('admin', 'doctor'),
  qrCodeController.verifyQRCode
);

module.exports = router;
