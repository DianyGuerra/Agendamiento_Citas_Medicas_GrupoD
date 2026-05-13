/**
 * Authentication Service
 * Handles all authentication operations: login, register, password reset, OAuth
 * 
 * @module external-api/services/AuthService
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../shared/config/database.config');
const jwtConfig = require('../../shared/config/jwt.config');
const { ValidationError, AuthorizationError, NotFoundError } = require('../../shared/errors');
const crypto = require('crypto');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and token
   */
  async register(userData) {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone_number, 
      cedula,
      date_of_birth,
      role = 'patient' 
    } = userData;

    // Validate email format
    if (!this._isValidEmail(email)) {
      throw new ValidationError('Formato de email inválido');
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new ValidationError('El email ya está registrado');
    }

    // Check if cedula already exists (if provided)
    if (cedula) {
      const { data: existingCedula } = await supabase
        .from('users')
        .select('id')
        .eq('cedula', cedula)
        .single();

      if (existingCedula) {
        throw new ValidationError('La cédula ya está registrada');
      }
    }

    // Validate password strength
    const passwordErrors = this._validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors.join('. '));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get role_id from roles table
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    const roleId = roleData?.id || 3; // Default to patient role (3)

    // Create user using correct schema: role_id, phone_number, cedula
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone_number,
        cedula,
        role_id: roleId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id, email, first_name, last_name, cedula, role_id,
        roles(id, name)
      `)
      .single();

    if (error) throw error;

    // Create patient/doctor record if needed
    if (role === 'patient') {
      const patientData = { user_id: user.id };
      if (date_of_birth) {
        patientData.date_of_birth = date_of_birth;
      }
      await supabase.from('patients').insert(patientData);
    }

    // Flatten for response
    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.roles?.name || 'patient'
    };

    // Generate token
    const token = this._generateToken(userResponse);

    return {
      user: userResponse,
      token,
      message: 'Usuario registrado exitosamente'
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email y contraseña son requeridos');
    }

    // Find user with role
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, role_id, is_active, roles(id, name)')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      throw new AuthorizationError('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw new AuthorizationError('Cuenta desactivada. Contacte al administrador.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthorizationError('Credenciales inválidas');
    }

    // Update last login (ignore if column doesn't exist)
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Flatten role for token and response
    const userForToken = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.roles?.name || 'patient'
    };

    // Generate token
    const token = this._generateToken(userForToken);

    return {
      user: userForToken,
      token,
      message: 'Inicio de sesión exitoso'
    };
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset token (to be sent via email)
   */
  async requestPasswordReset(email) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      // Don't reveal if email exists
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token - using correct column name 'token' from schema
    await supabase.from('password_resets').insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: new Date().toISOString()
    });

    return {
      resetToken, // This should be sent via email, not returned directly in production
      userId: user.id,
      userName: user.first_name,
      expiresAt,
      message: 'Token de restablecimiento generado'
    };
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async resetPassword(token, newPassword) {
    // Find valid reset token - using correct column name 'token' from schema
    const { data: resetRecord, error } = await supabase
      .from('password_resets')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !resetRecord) {
      throw new ValidationError('Token inválido o expirado');
    }

    // Validate new password
    const passwordErrors = this._validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors.join('. '));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetRecord.user_id);

    // Mark token as used
    await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetRecord.id);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Change password (for authenticated users)
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user's current password hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('Usuario', userId);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new ValidationError('Contraseña actual incorrecta');
    }

    // Validate new password
    const passwordErrors = this._validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors.join('. '));
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { message: 'Contraseña cambiada exitosamente' };
  }

  /**
   * Refresh JWT token
   * @param {string} token - Current token
   * @returns {Promise<Object>} New token
   */
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret, { ignoreExpiration: true });
      
      // Check if token is not too old (e.g., max 7 days)
      const tokenAge = Date.now() - (decoded.iat * 1000);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (tokenAge > maxAge) {
        throw new AuthorizationError('Token demasiado antiguo, inicie sesión nuevamente');
      }

      // Get fresh user data with role join
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role_id, is_active, roles(id, name)')
        .eq('id', decoded.id)
        .single();

      if (error || !user || !user.is_active) {
        throw new AuthorizationError('Usuario no válido');
      }

      // Flatten user for token
      const userForToken = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.roles?.name || 'patient'
      };

      const newToken = this._generateToken(userForToken);

      return {
        token: newToken,
        user: userForToken
      };
    } catch (err) {
      if (err instanceof AuthorizationError) throw err;
      throw new AuthorizationError('Token inválido');
    }
  }

  /**
   * Logout (invalidate session if using session storage)
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID (optional)
   * @returns {Promise<Object>} Success message
   */
  async logout(userId, sessionId = null) {
    // If using sessions table, invalidate session
    if (sessionId) {
      await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
    }

    return { message: 'Sesión cerrada exitosamente' };
  }

  // ===== Private Methods =====

  _generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  _isValidEmail(email) {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[^@\s.]+@[^@\s.]+\.[^@\s.]+$/;
  
  return emailRegex.test(email);
}

  _validatePasswordStrength(password) {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe incluir al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe incluir al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe incluir al menos un número');
    }
    
    return errors;
  }
}

module.exports = new AuthService();
