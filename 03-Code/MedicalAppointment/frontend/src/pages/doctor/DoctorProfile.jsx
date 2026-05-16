import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DoctorModel, AuthModel } from '../../models';
import { useAuth } from '../../context/AuthContext';

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: '',
    specialty_name: '',
    professional_id: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await DoctorModel.getProfile();
      
      // Axios devuelve la respuesta dentro de .data
      const doctorData = response.data || response;
      
      console.log('✅ Datos del doctor cargados:', doctorData);
      
      if (doctorData) {
        setFormData({
          first_name: doctorData.users?.first_name || '',
          last_name: doctorData.users?.last_name || '',
          email: doctorData.users?.email || '',
          phone_number: doctorData.users?.phone_number || '',
          bio: doctorData.bio || '',
          specialty_name: doctorData.specialties?.name || '',
          professional_id: doctorData.professional_id || '',
        });
      }
    } catch (error) {
      showNotification('Error al cargar el perfil', 'error');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await DoctorModel.updateProfile(formData);
      showNotification('Perfil actualizado exitosamente', 'success');
      updateUser(formData);
    } catch (error) {
      showNotification('Error al actualizar el perfil', 'error');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);
      await AuthModel.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      showNotification('Contraseña actualizada exitosamente', 'success');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      showNotification('Error al cambiar la contraseña', 'error');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <DoctorLayout>
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Perfil</h2>

        {/* Notification */}
        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'personal'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Información </span>Personal
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'password'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Cambiar Contraseña
          </button>
        </div>

        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Nombre
                  </span>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    style={{ fontSize: '16px' }}
                    required
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Apellido
                  </span>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    style={{ fontSize: '16px' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </span>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad
                  </span>
                  <input
                    type="text"
                    name="specialty_name"
                    value={formData.specialty_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    ID Profesional
                  </span>
                  <input
                    type="text"
                    name="professional_id"
                    value={formData.professional_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Biografía
                </span>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Información sobre ti como doctor..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </span>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </span>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </span>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
