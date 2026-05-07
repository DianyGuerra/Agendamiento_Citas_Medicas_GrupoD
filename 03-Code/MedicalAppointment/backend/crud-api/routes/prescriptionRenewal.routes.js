/**
 * Prescription Renewal Routes
 * Routes for prescription renewal operations
 * 
 * @module crud-api/routes/prescriptionRenewal.routes
 */

const { Router } = require('express');
const prescriptionRenewalController = require('../controllers/prescriptionRenewal.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /prescription-renewals
 * @desc Request a prescription renewal (patient only)
 * @access Patient
 */
router.post('/', 
  requireRole('patient'),
  prescriptionRenewalController.requestRenewal
);

/**
 * @route GET /prescription-renewals
 * @desc Get renewals for current user (patient or doctor)
 * @access Patient, Doctor
 */
router.get('/', 
  requireRole('patient', 'doctor'),
  prescriptionRenewalController.getMyRenewals
);

/**
 * @route GET /prescription-renewals/pending-count
 * @desc Get count of pending renewals (doctor)
 * @access Doctor
 */
router.get('/pending-count',
  requireRole('doctor'),
  prescriptionRenewalController.getPendingCount
);

/**
 * @route GET /prescription-renewals/:id
 * @desc Get renewal by ID
 * @access Patient, Doctor
 */
router.get('/:id',
  requireRole('patient', 'doctor'),
  prescriptionRenewalController.getById
);

/**
 * @route PUT /prescription-renewals/:id/approve
 * @desc Approve a renewal request (doctor only)
 * @access Doctor
 */
router.put('/:id/approve',
  requireRole('doctor'),
  prescriptionRenewalController.approveRenewal
);

/**
 * @route PUT /prescription-renewals/:id/reject
 * @desc Reject a renewal request (doctor only)
 * @access Doctor
 */
router.put('/:id/reject',
  requireRole('doctor'),
  prescriptionRenewalController.rejectRenewal
);

/**
 * @route DELETE /prescription-renewals/:id
 * @desc Cancel a renewal request (patient only)
 * @access Patient
 */
router.delete('/:id',
  requireRole('patient'),
  prescriptionRenewalController.cancelRenewal
);

module.exports = router;
