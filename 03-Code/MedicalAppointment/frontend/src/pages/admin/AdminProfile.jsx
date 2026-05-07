import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Edit profile
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Sessions
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin profile
      const [profileRes, sessionsRes] = await Promise.all([
        crudApi.get(`/users/${user?.id}`),
        crudApi.get(`/users/${user?.id}/sessions`).catch(() => ({ data: [] })),
      ]);
      
      const profile = profileRes.data.data || profileRes.data;
      setAdminData(profile);
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
      });
      setSessions(sessionsRes.data.data || sessionsRes.data || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      await crudApi.put(`/users/${user?.id}`, profileForm);
      showNotification('Perfil actualizado correctamente', 'success');
      setIsEditing(false);
      loadAdminData();
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Error al guardar perfil', 'error');
    }
  };

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    try {
      await crudApi.post(`/users/${user?.id}/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      showNotification('Contraseña actualizada correctamente', 'success');
      setShowPasswordModal(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(error.response?.data?.error || 'Error al cambiar contraseña', 'error');
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await crudApi.delete(`/users/${user?.id}/sessions/${sessionId}`);
      showNotification('Sesión terminada', 'success');
      loadAdminData();
    } catch (error) {
      console.error('Error terminating session:', error);
      showNotification('Error al terminar sesión', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      manage_users: 'Gestionar Usuarios',
      manage_doctors: 'Gestionar Doctores',
      manage_patients: 'Gestionar Pacientes',
      manage_appointments: 'Gestionar Citas',
      manage_billing: 'Gestionar Facturación',
      view_reports: 'Ver Reportes',
      manage_settings: 'Gestionar Configuración',
      manage_roles: 'Gestionar Roles',
    };
    return labels[permission] || permission;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        {/* Notification */}
        {notification && (
          <div className={`p-3 sm:p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Perfil</h2>
          <p className="text-sm sm:text-base text-gray-600">Configuración de cuenta y seguridad</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary-500" />
              </div>
              <div className="text-white">
                <h3 className="text-lg sm:text-xl font-bold">
                  {adminData?.first_name} {adminData?.last_name}
                </h3>
                <p className="text-primary-100 text-sm sm:text-base truncate max-w-xs">{adminData?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-white/20 rounded text-xs sm:text-sm">
                  <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  {adminData?.administrator?.is_super_admin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm sm:text-base"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Nombre Completo</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">
                      {adminData?.first_name} {adminData?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Email</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{adminData?.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Teléfono</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{adminData?.phone_number || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Miembro desde</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDate(adminData?.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 text-sm sm:text-base"
                >
                  Editar Perfil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Card */}
        {adminData?.administrator?.permissions && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-primary-500" />
              Permisos Asignados
            </h3>
            <div className="flex flex-wrap gap-2">
              {adminData.administrator.is_super_admin ? (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium">
                  Acceso Total (Super Admin)
                </span>
              ) : (
                adminData.administrator.permissions.map((permission, idx) => (
                  <span 
                    key={idx}
                    className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs sm:text-sm"
                  >
                    {getPermissionLabel(permission)}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* Security Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-primary-500" />
            Seguridad
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">Contraseña</p>
                <p className="text-xs sm:text-sm text-gray-500">Última actualización: {formatDate(adminData?.password_changed_at) || 'Nunca'}</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 text-sm"
              >
                Cambiar Contraseña
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">Cerrar Todas las Sesiones</p>
                <p className="text-sm text-gray-500">Cerrar sesión en todos los dispositivos excepto este</p>
              </div>
              <button
                onClick={() => {
                  // Logout all other sessions
                  logout();
                }}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Cerrar Sesiones
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ComputerDesktopIcon className="w-5 h-5 text-primary-500" />
              Sesiones Activas
            </h3>
            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ComputerDesktopIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{session.device || 'Dispositivo desconocido'}</p>
                      <p className="text-sm text-gray-500">
                        {session.ip_address} • {formatDate(session.created_at)}
                      </p>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Terminar
                    </button>
                  )}
                  {session.is_current && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Sesión actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Cambiar Contraseña</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={changePassword}
                  disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
