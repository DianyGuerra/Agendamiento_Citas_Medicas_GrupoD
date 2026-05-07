/**
 * Security Controller
 * Handles HTTP requests for Security & Access Management
 * Centralizes users, roles, administrators, password resets, and audit logs
 * 
 * @module crud-api/controllers/SecurityController
 */

const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const administratorRepository = require('../repositories/administrator.repository');
const passwordResetRepository = require('../repositories/passwordReset.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const { supabase } = require('../../shared/config/database.config');
const bcrypt = require('bcrypt');

class SecurityController {
  // =========================================================================
  // USERS MANAGEMENT
  // =========================================================================

  /**
   * GET /security/users
   * Get all users with full details for security management
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { role, status, search } = req.query;

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        cedula,
        phone_number,
        is_active,
        is_email_verified,
        created_at,
        updated_at,
        role:roles (
          id,
          name,
          code,
          label
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (role) {
      const roleData = await roleRepository.findByCode(role);
      if (roleData) {
        query = query.eq('role_id', roleData.id);
      }
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,cedula.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const pagination = createPagination(count || 0, page, limit);
    return ResponseBuilder.paginated(res, users, pagination);
  });

  /**
   * GET /security/users/:id
   * Get user details with related records (patients, doctors, administrators)
   */
  getUserDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get user with role
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        role:roles (
          id,
          name,
          code,
          label
        )
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      throw new NotFoundError('Usuario', id);
    }

    // Check for related records
    const [patientResult, doctorResult, adminResult] = await Promise.all([
      supabase.from('patients').select('id, created_at').eq('user_id', id).single(),
      supabase.from('doctors').select('id, specialty_id, active, created_at').eq('user_id', id).single(),
      supabase.from('administrators').select('id, permissions, is_super_admin, created_at').eq('user_id', id).single()
    ]);

    // Remove password_hash from response
    delete user.password_hash;

    const userWithRelations = {
      ...user,
      relations: {
        patient: patientResult.data || null,
        doctor: doctorResult.data || null,
        administrator: adminResult.data || null
      }
    };

    return ResponseBuilder.success(res, userWithRelations);
  });

  /**
   * PATCH /security/users/:id/status
   * Activate or deactivate user account
   */
  updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminUserId = req.user.id;

    if (typeof is_active !== 'boolean') {
      throw new ValidationError('is_active debe ser un booleano');
    }

    // Prevent self-deactivation
    if (id === adminUserId && !is_active) {
      throw new ValidationError('No puedes desactivar tu propia cuenta');
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    // Update user status
    const { data: updated, error } = await supabase
      .from('users')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      table_name: 'users',
      record_id: id,
      old_values: { is_active: existing.is_active },
      new_values: { is_active },
      description: `Usuario ${existing.email} ${is_active ? 'activado' : 'desactivado'}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, updated, 200, `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`);
  });

  /**
   * PATCH /security/users/:id/role
   * Change user role
   */
  changeUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role_id, confirm } = req.body;
    const adminUserId = req.user.id;

    if (!role_id) {
      throw new ValidationError('role_id es requerido');
    }

    // Prevent self-role-change
    if (id === adminUserId) {
      throw new ValidationError('No puedes cambiar tu propio rol');
    }

    // Require confirmation for this sensitive action
    if (confirm !== true) {
      throw new ValidationError('Esta es una acción sensible. Envía confirm: true para confirmar');
    }

    const existing = await userRepository.findWithRole(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    // Verify new role exists
    const newRole = await roleRepository.findById(role_id);
    if (!newRole) {
      throw new NotFoundError('Rol', role_id);
    }

    // Update user role
    const { data: updated, error } = await supabase
      .from('users')
      .update({ role_id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        roles:role_id (id, name, code, label)
      `)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'USER_ROLE_CHANGED',
      table_name: 'users',
      record_id: id,
      old_values: { role_id: existing.roles?.id, role_name: existing.roles?.name },
      new_values: { role_id, role_name: newRole.name },
      description: `Rol de usuario ${existing.email} cambiado de ${existing.roles?.name || 'ninguno'} a ${newRole.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Remove password_hash from response
    delete updated.password_hash;

    return ResponseBuilder.success(res, updated, 200, 'Rol de usuario actualizado exitosamente');
  });

  /**
   * PATCH /security/users/:id/verify-email
   * Force verify or send verification email
   */
  manageEmailVerification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force_verify } = req.body;
    const adminUserId = req.user.id;

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    if (force_verify) {
      // Force verify email
      const { data: updated, error } = await supabase
        .from('users')
        .update({ is_email_verified: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Log action
      await auditLogRepository.createLog({
        user_id: adminUserId,
        action: 'EMAIL_FORCE_VERIFIED',
        table_name: 'users',
        record_id: id,
        old_values: { is_email_verified: existing.is_email_verified },
        new_values: { is_email_verified: true },
        description: `Email de ${existing.email} verificado forzosamente por admin`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      delete updated.password_hash;
      return ResponseBuilder.success(res, updated, 200, 'Email verificado exitosamente');
    }

    // TODO: Implement resend verification email functionality
    return ResponseBuilder.success(res, { message: 'Funcionalidad de reenvío de verificación pendiente' });
  });

  // =========================================================================
  // PASSWORD RESET MANAGEMENT
  // =========================================================================

  /**
   * GET /security/users/:id/password-resets
   * Get password reset history for a user
   */
  getUserPasswordResets = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    const resets = await passwordResetRepository.findByUserId(id, { limit: 20 });

    // Mask tokens for security (show only first 8 chars)
    const maskedResets = resets.map(r => ({
      ...r,
      token: r.token.substring(0, 8) + '...'
    }));

    return ResponseBuilder.success(res, maskedResets);
  });

  /**
   * POST /security/users/:id/password-reset
   * Generate password reset token for a user
   */
  generatePasswordReset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { confirm } = req.body;
    const adminUserId = req.user.id;

    // Require confirmation
    if (confirm !== true) {
      throw new ValidationError('Esta es una acción sensible. Envía confirm: true para confirmar');
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    // Generate token
    const resetData = await passwordResetRepository.createToken(id, 24);

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'PASSWORD_RESET_GENERATED',
      table_name: 'password_resets',
      record_id: resetData.id,
      description: `Token de restablecimiento generado para ${existing.email}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Build reset URL (frontend should handle this)
    const resetUrl = `/reset-password?token=${resetData.token}`;

    return ResponseBuilder.success(res, {
      message: 'Token de restablecimiento generado',
      token: resetData.token,
      reset_url: resetUrl,
      expires_at: resetData.expires_at,
      user_email: existing.email
    });
  });

  /**
   * POST /security/users/:id/invalidate-tokens
   * Invalidate all active password reset tokens for a user
   */
  invalidatePasswordResets = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    const invalidatedCount = await passwordResetRepository.invalidateUserTokens(id);

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'PASSWORD_TOKENS_INVALIDATED',
      table_name: 'password_resets',
      record_id: id,
      description: `${invalidatedCount} tokens invalidados para ${existing.email}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, {
      message: `${invalidatedCount} tokens invalidados`,
      invalidated_count: invalidatedCount
    });
  });

  /**
   * POST /security/users/:id/set-password
   * Admin sets a new password for a user
   */
  setUserPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { new_password, confirm } = req.body;
    const adminUserId = req.user.id;

    if (!new_password || new_password.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    }

    if (confirm !== true) {
      throw new ValidationError('Esta es una acción sensible. Envía confirm: true para confirmar');
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Invalidate all password reset tokens
    await passwordResetRepository.invalidateUserTokens(id);

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'PASSWORD_SET_BY_ADMIN',
      table_name: 'users',
      record_id: id,
      description: `Contraseña establecida por admin para ${existing.email}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, { message: 'Contraseña actualizada exitosamente' });
  });

  // =========================================================================
  // ROLES MANAGEMENT
  // =========================================================================

  /**
   * GET /security/roles
   * Get all roles with user counts
   */
  getAllRoles = asyncHandler(async (req, res) => {
    const roles = await roleRepository.findAllWithUserCount();

    // Mark core roles
    const rolesWithMeta = roles.map(role => ({
      ...role,
      is_core: roleRepository.isCoreRole(role.code),
      can_delete: !roleRepository.isCoreRole(role.code) && role.user_count === 0
    }));

    return ResponseBuilder.success(res, rolesWithMeta);
  });

  /**
   * GET /security/roles/:id
   * Get role by ID
   */
  getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Rol', id);
    }

    // Get user count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id);

    return ResponseBuilder.success(res, {
      ...role,
      user_count: count || 0,
      is_core: roleRepository.isCoreRole(role.code)
    });
  });

  /**
   * POST /security/roles
   * Create new role
   */
  createRole = asyncHandler(async (req, res) => {
    const { name, code, label, description } = req.body;
    const adminUserId = req.user.id;

    if (!name || !code) {
      throw new ValidationError('name y code son requeridos');
    }

    // Check if code is core role
    if (roleRepository.isCoreRole(code)) {
      throw new ValidationError('No puedes crear un rol con código reservado (admin, doctor, patient)');
    }

    // Check if code exists
    const existing = await roleRepository.findByCode(code);
    if (existing) {
      throw new ValidationError('Ya existe un rol con este código');
    }

    const { data: role, error } = await supabase
      .from('roles')
      .insert({ name, code, label: label || name, description })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'ROLE_CREATED',
      table_name: 'roles',
      record_id: role.id,
      new_values: { name, code },
      description: `Rol "${name}" creado`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.created(res, role, 'Rol creado exitosamente');
  });

  /**
   * PUT /security/roles/:id
   * Update role (only non-core roles)
   */
  updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, label, description } = req.body;
    const adminUserId = req.user.id;

    const existing = await roleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    // Prevent editing core role code
    if (roleRepository.isCoreRole(existing.code)) {
      // Allow only label and description updates for core roles
      const { data: updated, error } = await supabase
        .from('roles')
        .update({ label, description })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return ResponseBuilder.success(res, updated, 200, 'Rol actualizado (solo label/descripción para roles core)');
    }

    const { data: updated, error } = await supabase
      .from('roles')
      .update({ name, label: label || name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'ROLE_UPDATED',
      table_name: 'roles',
      record_id: id,
      old_values: { name: existing.name },
      new_values: { name },
      description: `Rol "${existing.name}" actualizado`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, updated, 200, 'Rol actualizado exitosamente');
  });

  /**
   * PATCH /security/roles/:id/permissions
   * Update role permissions
   */
  updateRolePermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
    const adminUserId = req.user.id;

    if (!Array.isArray(permissions)) {
      throw new ValidationError('permissions debe ser un array de strings');
    }

    const existing = await roleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    const { data: updated, error } = await supabase
      .from('roles')
      .update({ permissions })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'ROLE_PERMISSIONS_UPDATED',
      table_name: 'roles',
      record_id: id,
      old_values: { permissions: existing.permissions || [] },
      new_values: { permissions },
      description: `Permisos del rol "${existing.name}" actualizados`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, updated, 200, 'Permisos del rol actualizados exitosamente');
  });

  /**
   * DELETE /security/roles/:id
   * Delete role (only non-core roles with 0 users)
   */
  deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const existing = await roleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    // Prevent deleting core roles
    if (roleRepository.isCoreRole(existing.code)) {
      throw new ForbiddenError('No puedes eliminar roles core (admin, doctor, patient)');
    }

    // Check if role has users
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id);

    if (count > 0) {
      throw new ValidationError(`No puedes eliminar un rol que tiene ${count} usuarios asignados`);
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'ROLE_DELETED',
      table_name: 'roles',
      record_id: id,
      old_values: { name: existing.name, code: existing.code },
      description: `Rol "${existing.name}" eliminado`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, { id }, 200, 'Rol eliminado exitosamente');
  });

  // =========================================================================
  // ADMINISTRATORS MANAGEMENT
  // =========================================================================

  /**
   * GET /security/administrators
   * Get all administrators with user details
   */
  getAllAdministrators = asyncHandler(async (req, res) => {
    const administrators = await administratorRepository.findAllWithUsers();
    return ResponseBuilder.success(res, administrators);
  });

  /**
   * GET /security/administrators/:id
   * Get administrator by ID
   */
  getAdministratorById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: admin, error } = await supabase
      .from('administrators')
      .select(`
        *,
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    if (error || !admin) {
      throw new NotFoundError('Administrador', id);
    }

    return ResponseBuilder.success(res, admin);
  });

  /**
   * PATCH /security/administrators/:id/permissions
   * Update administrator permissions
   */
  updateAdminPermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissions, confirm } = req.body;
    const adminUserId = req.user.id;

    if (!Array.isArray(permissions)) {
      throw new ValidationError('permissions debe ser un array');
    }

    if (confirm !== true) {
      throw new ValidationError('Esta es una acción sensible. Envía confirm: true para confirmar');
    }

    const existing = await administratorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Administrador', id);
    }

    const updated = await administratorRepository.updatePermissions(id, permissions);

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: 'ADMIN_PERMISSIONS_UPDATED',
      table_name: 'administrators',
      record_id: id,
      old_values: { permissions: existing.permissions },
      new_values: { permissions },
      description: `Permisos de administrador actualizados`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, updated, 200, 'Permisos actualizados exitosamente');
  });

  /**
   * PATCH /security/administrators/:id/super-admin
   * Toggle super admin status
   */
  toggleSuperAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_super_admin, confirm } = req.body;
    const adminUserId = req.user.id;

    if (typeof is_super_admin !== 'boolean') {
      throw new ValidationError('is_super_admin debe ser un booleano');
    }

    if (confirm !== true) {
      throw new ValidationError('Esta es una acción CRÍTICA. Envía confirm: true para confirmar');
    }

    const existing = await administratorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Administrador', id);
    }

    // Check if current admin is super admin
    const currentAdmin = await administratorRepository.findByUserId(adminUserId);
    if (!currentAdmin?.is_super_admin) {
      throw new ForbiddenError('Solo super admins pueden modificar el estado de super admin');
    }

    // Prevent removing the last super admin
    if (!is_super_admin && existing.is_super_admin) {
      const { count } = await supabase
        .from('administrators')
        .select('*', { count: 'exact', head: true })
        .eq('is_super_admin', true);

      if (count <= 1) {
        throw new ValidationError('No se puede quitar el status de super admin. Debe haber al menos un super administrador en el sistema.');
      }
    }

    const updated = await administratorRepository.toggleSuperAdmin(id, is_super_admin);

    // Log action
    await auditLogRepository.createLog({
      user_id: adminUserId,
      action: is_super_admin ? 'SUPER_ADMIN_GRANTED' : 'SUPER_ADMIN_REVOKED',
      table_name: 'administrators',
      record_id: id,
      old_values: { is_super_admin: existing.is_super_admin },
      new_values: { is_super_admin },
      description: `Super admin ${is_super_admin ? 'otorgado' : 'revocado'}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    return ResponseBuilder.success(res, updated, 200, `Super admin ${is_super_admin ? 'otorgado' : 'revocado'} exitosamente`);
  });

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================

  /**
   * GET /security/audit-logs
   * Get audit logs with filters
   */
  getAuditLogs = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { userId, action, tableName, startDate, endDate } = req.query;

    const logs = await auditLogRepository.findAllWithDetails({
      limit,
      offset,
      userId,
      action,
      tableName,
      startDate,
      endDate
    });

    const total = await auditLogRepository.countWithFilters({ userId, action, tableName });
    const pagination = createPagination(total, page, limit);

    return ResponseBuilder.paginated(res, logs, pagination);
  });

  /**
   * GET /security/audit-logs/filters
   * Get available filter options for audit logs
   */
  getAuditLogFilters = asyncHandler(async (req, res) => {
    const [tableNames, actions] = await Promise.all([
      auditLogRepository.getDistinctTableNames(),
      auditLogRepository.getDistinctActions()
    ]);

    return ResponseBuilder.success(res, { tableNames, actions });
  });

  /**
   * GET /security/users/:id/activity
   * Get activity history for a specific user
   */
  getUserActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    const logs = await auditLogRepository.findByUserId(id, { limit, offset });
    const total = await auditLogRepository.countWithFilters({ userId: id });
    const pagination = createPagination(total, page, limit);

    return ResponseBuilder.paginated(res, logs, pagination);
  });

  // =========================================================================
  // PERMISSIONS MATRIX
  // =========================================================================

  /**
   * GET /security/permissions-matrix
   * Get the permissions matrix definition
   */
  getPermissionsMatrix = asyncHandler(async (req, res) => {
    // Define available permissions by module
    const permissionsMatrix = {
      citas: {
        label: 'Citas',
        permissions: ['citas.ver', 'citas.crear', 'citas.reprogramar', 'citas.cancelar', 'citas.reasignar', 'citas.checkin']
      },
      facturacion: {
        label: 'Facturación',
        permissions: ['facturacion.ver', 'facturacion.registrar_pago', 'facturacion.anular', 'facturacion.exportar']
      },
      doctores: {
        label: 'Doctores',
        permissions: ['doctores.ver', 'doctores.crear', 'doctores.editar', 'doctores.desactivar']
      },
      pacientes: {
        label: 'Pacientes',
        permissions: ['pacientes.ver', 'pacientes.editar', 'pacientes.desactivar', 'pacientes.historial']
      },
      horarios: {
        label: 'Horarios',
        permissions: ['horarios.ver', 'horarios.editar', 'horarios.excepciones']
      },
      consultorios: {
        label: 'Consultorios',
        permissions: ['consultorios.ver', 'consultorios.crear', 'consultorios.editar', 'consultorios.desactivar']
      },
      especialidades: {
        label: 'Especialidades',
        permissions: ['especialidades.ver', 'especialidades.crear', 'especialidades.editar', 'especialidades.eliminar']
      },
      reportes: {
        label: 'Reportes',
        permissions: ['reportes.ver', 'reportes.exportar']
      },
      auditoria: {
        label: 'Auditoría',
        permissions: ['auditoria.ver', 'auditoria.exportar']
      },
      seguridad: {
        label: 'Seguridad',
        permissions: ['seguridad.usuarios', 'seguridad.roles', 'seguridad.permisos', 'seguridad.reset_password']
      }
    };

    return ResponseBuilder.success(res, permissionsMatrix);
  });

  // =========================================================================
  // STATS
  // =========================================================================

  /**
   * GET /security/stats
   * Get security dashboard stats
   */
  getSecurityStats = asyncHandler(async (req, res) => {
    const [
      totalUsersResult,
      activeUsersResult,
      verifiedUsersResult,
      rolesResult,
      adminsResult,
      superAdminsResult,
      todayLogsResult
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_email_verified', true),
      supabase.from('roles').select('*', { count: 'exact', head: true }),
      supabase.from('administrators').select('*', { count: 'exact', head: true }),
      supabase.from('administrators').select('*', { count: 'exact', head: true }).eq('is_super_admin', true),
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('timestamp', new Date().toISOString().split('T')[0])
    ]);

    return ResponseBuilder.success(res, {
      total_users: totalUsersResult.count || 0,
      active_users: activeUsersResult.count || 0,
      verified_users: verifiedUsersResult.count || 0,
      total_roles: rolesResult.count || 0,
      admin_count: adminsResult.count || 0,
      super_admins: superAdminsResult.count || 0,
      today_logs: todayLogsResult.count || 0
    });
  });
}

module.exports = new SecurityController();
