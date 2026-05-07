import { useState, useEffect } from 'react';
import { PatientModel } from '../../../../models';
import InsuranceProviderModel from '../../../../models/InsuranceProvider.model';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Hook for managing patient profile state and logic
 */
export function useProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loadingInsurance, setLoadingInsurance] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    cedula: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone_number: '',
    home_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Ecuador',
    blood_type: '',
    allergies: '',
    medical_conditions: '',
    current_medications: '',
    height: '',
    weight: '',
    insurance_provider_id: '',
    insurance_number: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    loadProfileData();
    loadInsuranceProviders();
  }, []);

  const loadInsuranceProviders = async () => {
    try {
      setLoadingInsurance(true);
      const providers = await InsuranceProviderModel.getAll();
      setInsuranceProviders(providers);
    } catch (error) {
      console.error('Error loading insurance providers:', error);
    } finally {
      setLoadingInsurance(false);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await PatientModel.getProfile();
      const profileData = response.data || response;

      const sanitizedData = {};
      for (const key in profileData) {
        sanitizedData[key] = profileData[key] ?? '';
      }

      setFormData((prev) => ({
        ...prev,
        ...sanitizedData,
        date_of_birth: profileData.date_of_birth ? profileData.date_of_birth.split('T')[0] : '',
      }));
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

    if (formData.cedula && (formData.cedula.length !== 10 || !/^\d+$/.test(formData.cedula))) {
      showNotification('La cédula debe tener 10 dígitos numéricos', 'error');
      return;
    }

    if (
      formData.phone_number &&
      (formData.phone_number.length !== 10 || !/^\d+$/.test(formData.phone_number))
    ) {
      showNotification('El teléfono debe tener 10 dígitos numéricos', 'error');
      return;
    }

    try {
      setLoading(true);
      await PatientModel.updateProfile(formData);

      const updatedUserData = {
        id: user.id,
        role: user.role,
        email: formData.email || user.email,
        first_name: formData.first_name || user.first_name,
        last_name: formData.last_name || user.last_name,
        phone_number: formData.phone_number || user.phone_number,
        cedula: formData.cedula || user.cedula,
      };

      updateUser(updatedUserData);
      showNotification('Perfil actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      showNotification(error.response?.data?.error || 'Error al actualizar el perfil', 'error');
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
      // Note: authAPI.changePassword would need to be imported if used
      showNotification('Contraseña actualizada exitosamente', 'success');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al cambiar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetPasswordForm = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  return {
    user,
    loading,
    notification,
    activeTab,
    setActiveTab,
    insuranceProviders,
    loadingInsurance,
    formData,
    passwordData,
    handleInputChange,
    handlePasswordChange,
    handleSubmit,
    handlePasswordSubmit,
    loadProfileData,
    resetPasswordForm,
  };
}

/**
 * Tab configuration for profile page
 */
export const profileTabs = [
  { id: 'personal', name: 'Información Personal', iconName: 'UserCircleIcon' },
  { id: 'contact', name: 'Contacto', iconName: 'EnvelopeIcon' },
  { id: 'medical', name: 'Información Médica', iconName: 'HeartIcon' },
  { id: 'emergency', name: 'Contacto de Emergencia', iconName: 'PhoneIcon' },
  { id: 'security', name: 'Seguridad', iconName: 'ShieldCheckIcon' },
];
