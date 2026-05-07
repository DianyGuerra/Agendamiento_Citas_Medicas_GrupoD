/**
 * QR Code Controller
 * Handles HTTP requests for QR code generation and verification
 * 
 * @module external-api/controllers/QRCodeController
 */

const qrCodeService = require('../services/qrCode.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class QRCodeController {
  /**
   * POST /qr-codes/prescription/:prescriptionId
   * Generate QR code for a prescription
   */
  generatePrescriptionQR = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;

    const result = await qrCodeService.generatePrescriptionQR(prescriptionId);

    return ResponseBuilder.success(res, result, 200, 'QR generado');
  });

  /**
   * POST /qr-codes/appointment/:appointmentId
   * Generate QR code for an appointment
   */
  generateAppointmentQR = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const result = await qrCodeService.generateAppointmentQR(appointmentId);

    return ResponseBuilder.success(res, result, 200, 'QR generado');
  });

  /**
   * POST /qr-codes/patient/check-in
   * Generate patient check-in QR
   */
  generatePatientCheckInQR = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;

    const result = await qrCodeService.generatePatientCheckInQR(patientUserId);

    return ResponseBuilder.success(res, result, 200, 'QR de check-in generado');
  });

  /**
   * POST /qr-codes/verify
   * Verify QR code content
   */
  verifyQRCode = asyncHandler(async (req, res) => {
    const { qrData } = req.body;

    const result = await qrCodeService.verifyQRCode(qrData);

    return ResponseBuilder.success(res, result);
  });

  /**
   * GET /qr-codes/verify-prescription/:token
   * Verify prescription by QR token (public endpoint)
   */
  verifyPrescriptionByToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    const result = await qrCodeService.verifyPrescriptionByToken(token, ipAddress);

    if (!result.valid) {
      return ResponseBuilder.error(res, result.message, 404);
    }

    return ResponseBuilder.success(res, result, 200, 'Receta verificada');
  });
}

module.exports = new QRCodeController();
