/**
 * Security Routes
 * RESTful routes for Security & Access Management
 * 
 * @module crud-api/routes/security.routes
 */

const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);
// All security routes require admin role
router.use(requireRole('admin'));

// =========================================================================
// STATS
// =========================================================================

/**
 * @route   GET /api/v1/security/stats
 * @desc    Get security dashboard stats
 * @access  Admin
 */
router.get('/stats', securityController.getSecurityStats);

// =========================================================================
// USERS MANAGEMENT
// =========================================================================

/**
 * @route   GET /api/v1/security/users
 * @desc    Get all users with full details
 * @access  Admin
 */
router.get('/users', securityController.getAllUsers);

/**
 * @route   GET /api/v1/security/users/:id
 * @desc    Get user details with relations
 * @access  Admin
 */
router.get('/users/:id', securityController.getUserDetails);

/**
 * @route   PATCH /api/v1/security/users/:id/status
 * @desc    Activate or deactivate user
 * @access  Admin
 */
router.patch('/users/:id/status', securityController.updateUserStatus);

/**
 * @route   PATCH /api/v1/security/users/:id/role
 * @desc    Change user role
 * @access  Admin
 */
router.patch('/users/:id/role', securityController.changeUserRole);

/**
 * @route   PATCH /api/v1/security/users/:id/verify-email
 * @desc    Force verify email or resend verification
 * @access  Admin
 */
router.patch('/users/:id/verify-email', securityController.manageEmailVerification);

/**
 * @route   GET /api/v1/security/users/:id/activity
 * @desc    Get user activity history from audit logs
 * @access  Admin
 */
router.get('/users/:id/activity', securityController.getUserActivity);

// =========================================================================
// PASSWORD RESET MANAGEMENT
// =========================================================================

/**
 * @route   GET /api/v1/security/users/:id/password-resets
 * @desc    Get password reset history for a user
 * @access  Admin
 */
router.get('/users/:id/password-resets', securityController.getUserPasswordResets);

/**
 * @route   POST /api/v1/security/users/:id/password-reset
 * @desc    Generate password reset token
 * @access  Admin
 */
router.post('/users/:id/password-reset', securityController.generatePasswordReset);

/**
 * @route   POST /api/v1/security/users/:id/invalidate-tokens
 * @desc    Invalidate all password reset tokens
 * @access  Admin
 */
router.post('/users/:id/invalidate-tokens', securityController.invalidatePasswordResets);

/**
 * @route   POST /api/v1/security/users/:id/set-password
 * @desc    Admin sets new password for user
 * @access  Admin
 */
router.post('/users/:id/set-password', securityController.setUserPassword);

// =========================================================================
// ROLES MANAGEMENT
// =========================================================================

/**
 * @route   GET /api/v1/security/roles
 * @desc    Get all roles with user counts
 * @access  Admin
 */
router.get('/roles', securityController.getAllRoles);

/**
 * @route   GET /api/v1/security/roles/:id
 * @desc    Get role by ID
 * @access  Admin
 */
router.get('/roles/:id', securityController.getRoleById);

/**
 * @route   POST /api/v1/security/roles
 * @desc    Create new role
 * @access  Admin
 */
router.post('/roles', securityController.createRole);

/**
 * @route   PUT /api/v1/security/roles/:id
 * @desc    Update role
 * @access  Admin
 */
router.put('/roles/:id', securityController.updateRole);

/**
 * @route   DELETE /api/v1/security/roles/:id
 * @desc    Delete role
 * @access  Admin
 */
router.delete('/roles/:id', securityController.deleteRole);

/**
 * @route   PATCH /api/v1/security/roles/:id/permissions
 * @desc    Update role permissions
 * @access  Admin
 */
router.patch('/roles/:id/permissions', securityController.updateRolePermissions);

// =========================================================================
// ADMINISTRATORS MANAGEMENT
// =========================================================================

/**
 * @route   GET /api/v1/security/administrators
 * @desc    Get all administrators
 * @access  Admin
 */
router.get('/administrators', securityController.getAllAdministrators);

/**
 * @route   GET /api/v1/security/administrators/:id
 * @desc    Get administrator by ID
 * @access  Admin
 */
router.get('/administrators/:id', securityController.getAdministratorById);

/**
 * @route   PATCH /api/v1/security/administrators/:id/permissions
 * @desc    Update administrator permissions
 * @access  Admin
 */
router.patch('/administrators/:id/permissions', securityController.updateAdminPermissions);

/**
 * @route   PATCH /api/v1/security/administrators/:id/super-admin
 * @desc    Toggle super admin status
 * @access  Admin (Super Admin only)
 */
router.patch('/administrators/:id/super-admin', securityController.toggleSuperAdmin);

// =========================================================================
// AUDIT LOGS
// =========================================================================

/**
 * @route   GET /api/v1/security/audit-logs
 * @desc    Get audit logs with filters
 * @access  Admin
 */
router.get('/audit-logs', securityController.getAuditLogs);

/**
 * @route   GET /api/v1/security/audit-logs/filters
 * @desc    Get available filter options for audit logs
 * @access  Admin
 */
router.get('/audit-logs/filters', securityController.getAuditLogFilters);

// =========================================================================
// PERMISSIONS MATRIX
// =========================================================================

/**
 * @route   GET /api/v1/security/permissions-matrix
 * @desc    Get the permissions matrix definition
 * @access  Admin
 */
router.get('/permissions-matrix', securityController.getPermissionsMatrix);

module.exports = router;
