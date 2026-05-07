import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { DoctorModel, SpecialtyModel } from '../../models';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [doctorToReset, setDoctorToReset] = useState(null);
  
  // Password modal data
  const [passwordData, setPasswordData] = useState({ name: '', email: '', password: '' });
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Promotion data (for existing user)
  const [promotionData, setPromotionData] = useState(null);
  
  // Form
  const [formData, setFormData] = useState({
    cedula: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    specialty_id: '',
    license_number: '',
    status: 'active',
  });
  
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, specialtiesRes, statsRes] = await Promise.all([
        DoctorModel.getAll(),
        SpecialtyModel.getAll(),
        DoctorModel.getStats(),
      ]);
      
      setDoctors(doctorsRes.data || doctorsRes);
      setSpecialties(specialtiesRes.data || specialtiesRes);
      setStats(statsRes.data || statsRes);
    } catch (error) {
      showNotification('Error al cargar doctores', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (specialtyFilter) params.specialty = specialtyFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = Object.keys(params).length > 0
        ? await DoctorModel.filter(params)
        : await DoctorModel.getAll();
      
      setDoctors(response.data || response);
    } catch (error) {
      showNotification('Error al filtrar doctores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
    setStatusFilter('');
    loadData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.cedula.length !== 10 || !/^\d+$/.test(formData.cedula)) {
      showNotification('La cédula debe tener 10 dígitos numéricos', 'error');
      return;
    }

    if (formData.phone_number && (formData.phone_number.length !== 10 || !/^\d+$/.test(formData.phone_number))) {
      showNotification('El teléfono debe tener 10 dígitos numéricos', 'error');
      return;
    }
    
    try {
      if (currentDoctor) {
        await DoctorModel.update(currentDoctor.id, formData);
        showNotification('Doctor actualizado exitosamente', 'success');
        closeModal();
        loadData();
      } else {
        // Use createWithUser to create doctor with user account
        const result = await DoctorModel.createWithUser(formData);
        const data = result.data || result;
        
        // Check if user requires promotion (already exists)
        if (data.requires_promotion) {
          setPromotionData({
            existingUser: data.existing_user,
            formData: formData
          });
          setShowPromotionModal(true);
          return; // Don't close modal yet
        }
        
        // Check if user was promoted
        if (data.promoted) {
          showNotification('Usuario existente promovido a doctor. Puede acceder con su contraseña actual.', 'success');
        } else {
          // New user created - show temporary password
          const tempPassword = data.temporary_password;
          if (tempPassword) {
            setPasswordData({
              name: `${formData.first_name} ${formData.last_name}`,
              email: formData.email,
              password: tempPassword
            });
            setShowPasswordModal(true);
          }
          showNotification('Doctor creado con cuenta de usuario', 'success');
        }
        
        closeModal();
        loadData();
      }
    } catch (error) {
      showNotification(
        error.message || error.response?.data?.error || 'Error al guardar doctor',
        'error'
      );
    }
  };

  const handlePromoteUser = async () => {
    if (!promotionData) return;
    
    try {
      // Call createWithUser with promote_existing = true
      const result = await DoctorModel.createWithUser({
        ...promotionData.formData,
        promote_existing: true
      });
      
      const data = result.data || result;
      showNotification('Usuario promovido a doctor exitosamente. Puede acceder con su contraseña actual.', 'success');
      
      setShowPromotionModal(false);
      setPromotionData(null);
      closeModal();
      loadData();
    } catch (error) {
      showNotification(
        error.message || 'Error al promover usuario',
        'error'
      );
    }
  };

  const handleResetPassword = (doctor) => {
    setDoctorToReset(doctor);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!doctorToReset) return;
    
    try {
      const result = await DoctorModel.resetPassword(doctorToReset.id);
      const tempPassword = result.data?.temporary_password || result.temporary_password;
      if (tempPassword) {
        setPasswordData({
          name: `${doctorToReset.first_name} ${doctorToReset.last_name}`,
          email: doctorToReset.email,
          password: tempPassword
        });
        setShowPasswordModal(true);
      }
      showNotification('Contraseña restablecida exitosamente', 'success');
    } catch (error) {
      showNotification(
        error.message || 'Error al restablecer contraseña',
        'error'
      );
    } finally {
      setShowResetPasswordModal(false);
      setDoctorToReset(null);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(passwordData.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (err) {
      showNotification('Error al copiar al portapapeles', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await DoctorModel.delete(currentDoctor.id);
      showNotification('Doctor eliminado exitosamente', 'success');
      setShowDeleteModal(false);
      setCurrentDoctor(null);
      loadData();
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al eliminar doctor',
        'error'
      );
    }
  };

  const openAddModal = () => {
    setCurrentDoctor(null);
    setFormData({
      cedula: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      specialty_id: '',
      license_number: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    setCurrentDoctor(doctor);
    setFormData({
      cedula: doctor.cedula || '',
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      phone_number: doctor.phone_number || '',
      specialty_id: doctor.specialty_id || '',
      license_number: doctor.license_number || '',
      status: doctor.status || 'active',
    });
    setShowModal(true);
  };

  const openDeleteModal = (doctor) => {
    setCurrentDoctor(doctor);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentDoctor(null);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      vacation: 'bg-yellow-100 text-yellow-800',
    };
    
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      vacation: 'Vacaciones',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatsCard title="Doctores Activos" value={stats.active || 0} color="green" />
        <StatsCard title="Especialidades" value={specialties.length} color="blue" />
        <StatsCard title="Total Doctores" value={stats.total || 0} color="yellow" />
        <StatsCard title="Inactivos" value={stats.inactive || 0} color="red" />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Filtros de Búsqueda</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Especialidad</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              style={{ fontSize: '16px' }}
            >
              <option value="">Todas</option>
              {specialties.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              style={{ fontSize: '16px' }}
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="vacation">Vacaciones</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Buscar Doctor</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o cédula..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm"
            >
              Aplicar
            </button>
            <button
              onClick={clearFilters}
              className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Add Button and Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Lista de Doctores</h3>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Agregar Doctor
          </button>
        </div>

        {/* Mobile Cards View */}
        <div className="block lg:hidden">
          {doctors.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              No se encontraron doctores
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {doctor.first_name} {doctor.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{doctor.cedula || 'Sin cédula'}</p>
                    </div>
                    {getStatusBadge(doctor.status || (doctor.active ? 'active' : 'inactive'))}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>{doctor.specialty_name || doctor.specialty?.name || 'Sin especialidad'}</p>
                    <p className="truncate">{doctor.email || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => openEditModal(doctor)}
                      className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleResetPassword(doctor)}
                      className="flex-1 p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <KeyIcon className="w-4 h-4" />
                      Clave
                    </button>
                    <button
                      onClick={() => openDeleteModal(doctor)}
                      className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Cédula</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Especialidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Teléfono</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron doctores
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{doctor.cedula || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {doctor.first_name} {doctor.last_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doctor.specialty_name || doctor.specialty?.name || 'Sin especialidad'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4">{getStatusBadge(doctor.status || (doctor.active ? 'active' : 'inactive'))}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(doctor)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Restablecer Contraseña"
                        >
                          <KeyIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(doctor)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center rounded-t-2xl sticky top-0">
              <h2 className="text-lg sm:text-2xl font-bold">
                {currentDoctor ? 'Editar Doctor' : 'Agregar Doctor'}
              </h2>
              <button onClick={closeModal} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    pattern="[0-9]{10}"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="0123456789"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Juan"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Pérez"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@clinica.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    pattern="[0-9]{10}"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Especialidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.specialty_id}
                    onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Seleccionar especialidad</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="MSP-12345"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="vacation">Vacaciones</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors shadow-md hover:shadow-lg order-1 sm:order-2"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-red-500 text-white px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Confirmar Eliminación</h2>
            </div>

            <div className="p-8">
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea eliminar al doctor{' '}
                <strong>{currentDoctor?.first_name} {currentDoctor?.last_name}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <KeyIcon className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Confirmar Restablecimiento</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Esta acción generará una nueva contraseña temporal y la actual dejará de funcionar.
                </p>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea restablecer la contraseña del doctor{' '}
                <strong>{doctorToReset?.first_name} {doctorToReset?.last_name}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setDoctorToReset(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmResetPassword}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-semibold transition-colors"
                >
                  Restablecer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <KeyIcon className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Contraseña Temporal</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Guarde esta contraseña. No se mostrará de nuevo a menos que la restablezca.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Doctor</label>
                  <p className="text-gray-900 font-semibold">{passwordData.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900">{passwordData.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Contraseña Temporal</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 font-mono text-lg text-gray-900 select-all">
                      {passwordData.password}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`p-3 rounded-lg transition-colors ${
                        passwordCopied 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Copiar al portapapeles"
                    >
                      {passwordCopied ? (
                        <CheckIcon className="w-6 h-6" />
                      ) : (
                        <ClipboardDocumentIcon className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                  {passwordCopied && (
                    <p className="text-green-600 text-sm mt-2 font-medium">✓ Copiado al portapapeles</p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Comunique esta contraseña al doctor para que pueda acceder al sistema. 
                Si la olvida, puede restablecerla usando el botón <KeyIcon className="w-4 h-4 inline text-yellow-600" /> en la tabla.
              </p>

              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ name: '', email: '', password: '' });
                  setPasswordCopied(false);
                }}
                className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Promoción de Usuario */}
      {showPromotionModal && promotionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Usuario Existente Detectado</h3>
              <p className="text-gray-600 mb-4">
                Se encontró un usuario con este email que actualmente tiene rol de <strong>{promotionData.existingUser?.current_role || 'usuario'}</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Usuario encontrado:</p>
              <p className="font-medium text-gray-800">
                {promotionData.existingUser?.first_name} {promotionData.existingUser?.last_name}
              </p>
              <p className="text-sm text-gray-600">{promotionData.existingUser?.email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>¿Qué significa promover?</strong><br />
                El usuario conservará su contraseña actual y se le asignará el rol de <strong>Doctor</strong>. 
                Podrá acceder al panel de doctores con sus credenciales existentes.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPromotionModal(false);
                  setPromotionData(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePromoteUser}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Promover a Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatsCard({ title, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform`}>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{value}</div>
      <div className="text-xs sm:text-sm opacity-90">{title}</div>
    </div>
  );
}