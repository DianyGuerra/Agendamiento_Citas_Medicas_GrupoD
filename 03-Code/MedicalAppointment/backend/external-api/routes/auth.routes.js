/**
 * Auth Routes
 * @module external-api/routes/auth.routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const googleAuthService = require('../services/googleAuth.service');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate, schemas } = require('../../shared/middleware/validation.middleware');

// =============================================================================
// GOOGLE OAUTH ROUTES
// =============================================================================

/**
 * @route GET /auth/google
 * @desc Redirect to Google OAuth
 * @access Public
 */
router.get('/google',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Iniciar autenticacion con Google'
    #swagger.description = 'Redirige al usuario a la pantalla de consentimiento de Google OAuth.'
    #swagger.responses[302] = { description: 'Redireccion a Google OAuth.' }
    #swagger.responses[500] = { description: 'Error interno al iniciar Google OAuth.' }
  */
  (req, res) => {
  const authUrl = googleAuthService.getGoogleAuthUrl();
  res.redirect(authUrl);
  }
);

/**
 * @route GET /auth/google/callback
 * @desc Google OAuth callback
 * @access Public
 */
router.get('/google/callback',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Procesar callback de Google OAuth'
    #swagger.description = 'Procesa el codigo devuelto por Google y redirige al frontend con el token y el usuario autenticado.'
    #swagger.responses[302] = { description: 'Redireccion al frontend con el resultado de autenticacion.' }
    #swagger.responses[500] = { description: 'Error interno durante el callback; se redirige al frontend con el error.' }
  */
  async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    const result = await googleAuthService.handleGoogleCallback(code);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userJson = encodeURIComponent(JSON.stringify(result.user));
    
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&user=${userJson}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }
  }
);

// =============================================================================
// LOCAL AUTH ROUTES
// =============================================================================

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Registrar usuario'
    #swagger.description = 'Crea una cuenta local, crea el perfil de paciente cuando corresponde y devuelve un JWT.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password', 'first_name', 'last_name'],
            properties: {
              email: { type: 'string', format: 'email', example: 'paciente@example.com' },
              password: { type: 'string', format: 'password', minLength: 8, example: 'ClaveSegura1' },
              first_name: { type: 'string', example: 'Ana' },
              last_name: { type: 'string', example: 'Perez' },
              phone_number: { type: 'string', example: '0991234567' },
              cedula: { type: 'string', example: '1712345678' },
              date_of_birth: { type: 'string', format: 'date', example: '1995-04-18' },
              role: { type: 'string', example: 'patient' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Usuario registrado y token emitido.' }
    #swagger.responses[400] = { description: 'Datos invalidos, email o cedula ya registrados.' }
    #swagger.responses[500] = { description: 'Error interno al registrar el usuario.' }
  */
  validate(schemas.auth.register),
  authController.register
);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Iniciar sesion'
    #swagger.description = 'Valida las credenciales de una cuenta activa y devuelve un JWT.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'paciente@example.com' },
              password: { type: 'string', format: 'password', example: 'ClaveSegura1' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Inicio de sesion exitoso.' }
    #swagger.responses[400] = { description: 'Email o password ausentes o invalidos.' }
    #swagger.responses[401] = { description: 'Credenciales invalidas o cuenta inactiva.' }
    #swagger.responses[500] = { description: 'Error interno al iniciar sesion.' }
  */
  validate(schemas.auth.login),
  authController.login
);

/**
 * @route POST /auth/password-reset/request
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/password-reset/request',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Solicitar restablecimiento de password'
    #swagger.description = 'Genera un token de restablecimiento para el email indicado y solicita el envio del correo.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email', example: 'paciente@example.com' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Solicitud procesada sin revelar si el email existe.' }
    #swagger.responses[400] = { description: 'Email invalido o ausente.' }
    #swagger.responses[500] = { description: 'Error interno al solicitar el restablecimiento.' }
  */
  authController.requestPasswordReset
);

/**
 * @route POST /auth/password-reset/confirm
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/password-reset/confirm',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Confirmar restablecimiento de password'
    #swagger.description = 'Actualiza el password usando un token de restablecimiento vigente y no utilizado.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token', 'newPassword'],
            properties: {
              token: { type: 'string', example: 'reset-token' },
              newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NuevaClave1' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Password actualizado.' }
    #swagger.responses[400] = { description: 'Token invalido o expirado, o password debil.' }
    #swagger.responses[500] = { description: 'Error interno al restablecer el password.' }
  */
  authController.resetPassword
);

/**
 * @route POST /auth/change-password
 * @desc Change password (authenticated)
 * @access Private
 */
router.post(
  '/change-password',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Cambiar password autenticado'
    #swagger.description = 'Comprueba el password actual y lo reemplaza por uno nuevo para el usuario autenticado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: {
              currentPassword: { type: 'string', format: 'password', example: 'ClaveActual1' },
              newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NuevaClave1' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Password cambiado.' }
    #swagger.responses[400] = { description: 'Password actual incorrecto o nuevo password invalido.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[404] = { description: 'Usuario autenticado no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al cambiar el password.' }
  */
  authMiddleware,
  authController.changePassword
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh JWT token
 * @access Public
 */
router.post(
  '/refresh-token',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Renovar JWT'
    #swagger.description = 'Emite un JWT nuevo a partir de un token existente que no supere la antiguedad permitida.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token'],
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'JWT renovado.' }
    #swagger.responses[401] = { description: 'Token invalido, demasiado antiguo o asociado a un usuario inactivo.' }
    #swagger.responses[500] = { description: 'Error interno al renovar el token.' }
  */
  authController.refreshToken
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Cerrar sesion'
    #swagger.description = 'Cierra la sesion del usuario autenticado y elimina la sesion indicada cuando se envia sessionId.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', example: 'session-id' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Sesion cerrada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[500] = { description: 'Error interno al cerrar la sesion.' }
  */
  authMiddleware,
  authController.logout
);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get(
  '/me',
  /*
    #swagger.tags = ['Autenticacion']
    #swagger.summary = 'Obtener usuario autenticado'
    #swagger.description = 'Devuelve los datos del usuario cargados por el middleware de autenticacion.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Usuario autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el usuario.' }
  */
  authMiddleware,
  authController.getCurrentUser
);

module.exports = router;
