/**
 * Google OAuth Service
 * Handles Google authentication
 * 
 * @module external-api/services/googleAuth.service
 */

const { supabase } = require('../../shared/config/database.config');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class GoogleAuthService {
  /**
   * Generate Google OAuth URL
   * @returns {string} Google OAuth URL
   */
  getGoogleAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = encodeURIComponent('openid email profile');
    
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent`;
  }

  /**
   * Exchange authorization code for tokens and user info
   * @param {string} code - Authorization code from Google
   * @returns {Promise<Object>} User data and tokens
   */
  async handleGoogleCallback(code) {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Google token error:', tokens);
      throw new Error(tokens.error_description || 'Failed to exchange code for tokens');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
      throw new Error('Failed to get user email from Google');
    }

    // Find or create user in database
    const user = await this.findOrCreateUser(googleUser);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_code || 'patient'
      }
    };
  }

  /**
   * Find existing user or create new one
   * @param {Object} googleUser - Google user data
   * @returns {Promise<Object>} User object
   */
  async findOrCreateUser(googleUser) {
    // Check if user exists by google_id or email
    let { data: existingUser, error } = await supabase
      .from('users')
      .select(`
        id, email, first_name, last_name, is_active, google_id,
        roles!users_role_id_fkey(code)
      `)
      .or(`google_id.eq.${googleUser.id},email.eq.${googleUser.email}`)
      .single();

    if (existingUser) {
      // Update google_id if not set
      if (!existingUser.google_id) {
        await supabase
          .from('users')
          .update({ google_id: googleUser.id })
          .eq('id', existingUser.id);
      }
      
      return {
        ...existingUser,
        role_code: existingUser.roles?.code || 'patient'
      };
    }

    // Get patient role ID
    const { data: patientRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'patient')
      .single();

    if (!patientRole) {
      throw new Error('Patient role not found');
    }

    // Create new user
    const newUserId = uuidv4();
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        email: googleUser.email,
        first_name: googleUser.given_name || googleUser.name?.split(' ')[0] || 'Usuario',
        last_name: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
        google_id: googleUser.id,
        is_email_verified: true, // Google emails are verified
        is_active: true,
        role_id: patientRole.id,
        password_hash: null // No password for Google users
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error('Failed to create user account');
    }

    // Create patient record
    await supabase
      .from('patients')
      .insert({
        id: uuidv4(),
        user_id: newUserId
      });

    return {
      ...newUser,
      role_code: 'patient'
    };
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_code || 'patient'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}

module.exports = new GoogleAuthService();
