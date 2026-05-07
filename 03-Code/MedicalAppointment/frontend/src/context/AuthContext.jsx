/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 * 
 * @module context/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthModel from '../models/Auth.model';
import { STORAGE_KEYS, ROLES } from '../config/constants';

const AuthContext = createContext(null);

/**
 * Custom hook to access auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          if (parsedUser?.id && parsedUser?.role) {
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            clearAuthData();
          }
        } else if (storedToken) {
          try {
            const userData = await AuthModel.getCurrentUser();
            if (userData?.id && userData?.role) {
              setToken(storedToken);
              setUser(userData);
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
            } else {
              clearAuthData();
            }
          } catch {
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { token: newToken, user: userData } = await AuthModel.login(email, password);

      if (!newToken || !userData) {
        return { success: false, error: 'Respuesta inválida del servidor' };
      }

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const { token: newToken, user: newUser } = await AuthModel.register(userData);

      if (!newToken || !newUser) {
        return { success: false, error: 'Respuesta inválida del servidor' };
      }

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error al registrarse' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthModel.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  }, [clearAuthData]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await AuthModel.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error al cambiar contraseña' 
      };
    }
  }, []);

  const updateUser = useCallback((userData) => {
    if (!userData?.id || !userData?.role) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, [user]);

  const hasRole = useCallback((roles) => {
    if (!user?.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isPatient = user?.role === ROLES.PATIENT;
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isDoctor,
    isPatient,
    login,
    register,
    logout,
    changePassword,
    updateUser,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;