/**
 * User Controller
 * Handles HTTP requests for User CRUD operations
 * 
 * @module crud-api/controllers/UserController
 */

const userRepository = require('../repositories/user.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');

class UserController {
  /**
   * GET /users
   * Get all users with pagination
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { role } = req.query;

    let users;
    let total;

    if (role) {
      users = await userRepository.findByRole(role, { limit, offset });
      total = users.length;
    } else {
      users = await userRepository.findAll({ limit, offset });
      total = await userRepository.count();
    }

    const pagination = createPagination(total, page, limit);
    return ResponseBuilder.paginated(res, users, pagination);
  });

  /**
   * GET /users/:id
   * Get user by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await userRepository.findWithRole(id);
    
    if (!user) {
      throw new NotFoundError('Usuario', id);
    }

    return ResponseBuilder.success(res, user);
  });

  /**
   * GET /users/me
   * Get current authenticated user profile
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await userRepository.findWithRole(userId);
    
    if (!user) {
      throw new NotFoundError('Usuario', userId);
    }

    return ResponseBuilder.success(res, user);
  });

  /**
   * PUT /users/me
   * Update current authenticated user profile
   */
  updateCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, phone_number } = req.body;

    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('Usuario', userId);
    }

    const updated = await userRepository.update(userId, {
      first_name,
      last_name,
      phone_number
    });

    return ResponseBuilder.success(res, updated, 200, 'Perfil actualizado exitosamente');
  });

  /**
   * POST /users
   * Create new user
   */
  create = asyncHandler(async (req, res) => {
    const { email, first_name, last_name, cedula, phone_number, role_id, password_hash } = req.body;

    // Check if email exists
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ValidationError('El email ya está registrado');
    }

    // Check if cedula exists
    if (cedula) {
      const existingCedula = await userRepository.findByCedula(cedula);
      if (existingCedula) {
        throw new ValidationError('La cédula ya está registrada');
      }
    }

    const user = await userRepository.create({
      email,
      first_name,
      last_name,
      cedula,
      phone_number,
      role_id,
      password_hash,
      is_active: true
    });

    return ResponseBuilder.created(res, user, 'Usuario creado exitosamente');
  });

  /**
   * PUT /users/:id
   * Update user
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone_number, cedula } = req.body;

    // Check if user exists
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    // Check cedula uniqueness if changed
    if (cedula && cedula !== existing.cedula) {
      const existingCedula = await userRepository.findByCedula(cedula);
      if (existingCedula) {
        throw new ValidationError('La cédula ya está registrada');
      }
    }

    const updated = await userRepository.update(id, {
      first_name,
      last_name,
      phone_number,
      cedula
    });

    return ResponseBuilder.success(res, updated, 200, 'Usuario actualizado exitosamente');
  });

  /**
   * DELETE /users/:id
   * Soft delete user (deactivate)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    await userRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Usuario desactivado exitosamente');
  });

  /**
   * PATCH /users/:id/activate
   * Reactivate user
   */
  activate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    const updated = await userRepository.updateActiveStatus(id, true);

    return ResponseBuilder.success(res, updated, 200, 'Usuario activado exitosamente');
  });
}

module.exports = new UserController();
