import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PatientModel } from '../../models';
import InsuranceProviderModel from '../../models/InsuranceProvider.model';
import { crudApi } from '../../services/httpClient';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  
  // Form
  const [formData, setFormData] = useState({
    cedula: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    insurance_provider_id: '',
    insurance_policy_number: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
  });
  
  const [notification, setNotification] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientBillings, setPatientBillings] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [insuranceProviders, setInsuranceProviders] = useState([]);

  useEffect(() => {
    loadData();
    loadInsuranceProviders();
  }, []);

  const loadInsuranceProviders = async () => {
    try {
      const providers = await InsuranceProviderModel.getAll();
      setInsuranceProviders(providers);
    } catch (error) {
      console.error('Error loading insurance providers:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsRes, statsRes] = await Promise.all([
        PatientModel.getAll(),
        PatientModel.getStats(),
      ]);
      
      setPatients(patientsRes.data || patientsRes || []);
      setStats(statsRes.data || statsRes || { total: 0, active: 0, inactive: 0 });
    } catch (error) {
      showNotification('Error al cargar pacientes', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const response = await PatientModel.search(params);
      setPatients(response.data || response || []);
    } catch (error) {
      showNotification('Error al buscar pacientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
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
    
    try {
      if (currentPatient) {
        await PatientModel.update(currentPatient.id, formData);
        showNotification('Paciente actualizado exitosamente', 'success');
      } else {
        // Use createWithUser for new patients
        const result = await PatientModel.createWithUser({
          ...formData,
          emergency_contact_name: formData.emergency_contact,
          emergency_contact_phone: formData.emergency_phone,
          insurance_provider_id: formData.insurance_provider_id || null,
          insurance_number: formData.insurance_policy_number,
          medical_conditions: formData.chronic_conditions,
          status: 'active'
        });
        
        // Check if requires promotion
        if (result.data?.requires_promotion) {
          if (window.confirm(`${result.data.message}\n\n¿Desea agregar el perfil de paciente a este usuario?`)) {
            const promoted = await PatientModel.createWithUser({
              ...formData,
              emergency_contact_name: formData.emergency_contact,
              emergency_contact_phone: formData.emergency_phone,
              insurance_provider_id: formData.insurance_provider_id || null,
              insurance_number: formData.insurance_policy_number,
              medical_conditions: formData.chronic_conditions,
              status: 'active',
              promote_existing: true
            });
            showNotification('Paciente agregado exitosamente', 'success');
          } else {
            return;
          }
        } else if (result.data?.temporary_password) {
          showNotification(`Paciente creado. Contraseña temporal: ${result.data.temporary_password}`, 'success');
        } else {
          showNotification('Paciente creado exitosamente', 'success');
        }
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al guardar paciente', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await PatientModel.delete(currentPatient.id);
      showNotification('Paciente desactivado exitosamente', 'success');
      setShowDeleteModal(false);
      setCurrentPatient(null);
      loadData();
    } catch (error) {
      showNotification('Error al desactivar paciente', 'error');
    }
  };

  const openEditModal = (patient) => {
    setCurrentPatient(patient);
    setFormData({
      cedula: patient.cedula || '',
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      email: patient.email || '',
      phone_number: patient.phone_number || '',
      date_of_birth: patient.date_of_birth?.split('T')[0] || '',
      gender: patient.gender || '',
      blood_type: patient.blood_type || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      emergency_phone: patient.emergency_phone || '',
      insurance_provider_id: patient.insurance_provider_id || '',
      insurance_policy_number: patient.insurance_policy_number || '',
      allergies: patient.allergies || '',
      chronic_conditions: patient.chronic_conditions || '',
      current_medications: patient.current_medications || '',
    });
    setShowModal(true);
  };

  const openDetailModal = async (patient) => {
    setCurrentPatient(patient);
    setShowDetailModal(true);
    setDetailTab('info');
    setLoadingDetails(true);
    
    try {
      // Cargar historial de citas
      const [appointmentsRes, billingsRes] = await Promise.all([
        crudApi.get(`/appointments`, { params: { patient_user_id: patient.user_id || patient.id } }).catch(() => ({ data: [] })),
        crudApi.get(`/billings`, { params: { patient_user_id: patient.user_id || patient.id } }).catch(() => ({ data: [] })),
      ]);
      
      setPatientAppointments(appointmentsRes.data?.data || appointmentsRes.data || []);
      setPatientBillings(billingsRes.data?.data || billingsRes.data || []);
    } catch (error) {
      console.error('Error loading patient details:', error);
      setPatientAppointments([]);
      setPatientBillings([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const resetForm = () => {
    setCurrentPatient(null);
    setFormData({
      cedula: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      date_of_birth: '',
      gender: '',
      blood_type: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      insurance_provider_id: '',
      insurance_policy_number: '',
      allergies: '',
      chronic_conditions: '',
      current_medications: '',
    });
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC');
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-3 sm:p-4 rounded-lg text-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Pacientes</h2>
            <p className="text-sm text-gray-600 mt-1">Administra la información de los pacientes</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Nuevo Paciente
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total</h3>
            <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.total || patients.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Activos</h3>
            <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{stats.active || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Inactivos</h3>
            <p className="text-xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">{stats.inactive || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1">
              <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Buscar</span>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            
            <div className="w-full sm:w-40">
              <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ fontSize: '16px' }}
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Buscar
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block lg:hidden bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No se encontraron pacientes
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                      <p className="text-sm text-gray-500">{patient.cedula || 'Sin cédula'}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                      patient.is_active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {patient.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => openDetailModal(patient)}
                      className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => openEditModal(patient)}
                      className="flex-1 p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => { setCurrentPatient(patient); setShowDeleteModal(true); }}
                      className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1 text-sm"
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

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cédula</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Seguro</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No se encontraron pacientes
                    </td>
                  </tr>
                ) : patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.cedula || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{calculateAge(patient.date_of_birth)} años</td>
                    <td className="px-6 py-4 text-gray-600">{patient.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.insurance_providers?.name || 'Sin seguro'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        patient.is_active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(patient)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setCurrentPatient(patient); setShowDeleteModal(true); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Desactivar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Información Personal */}
                  <div className="lg:col-span-3">
                    <h4 className="font-semibold text-gray-800 mb-3">Información Personal</h4>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Cédula *</span>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.cedula}
                      onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Nombres *</span>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</span>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Email *</span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Teléfono</span>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</span>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Género</span>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</span>
                    <select
                      value={formData.blood_type}
                      onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div className="lg:col-span-3">
                    <span className="block text-sm font-medium text-gray-700 mb-1">Dirección</span>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="lg:col-span-3 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Contacto de Emergencia</h4>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Nombre</span>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Teléfono</span>
                    <input
                      type="tel"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Seguro Médico */}
                  <div className="lg:col-span-3 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Seguro Médico</h4>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Proveedor</span>
                    <select
                      value={formData.insurance_provider_id}
                      onChange={(e) => setFormData({...formData, insurance_provider_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sin seguro médico</option>
                      {insuranceProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Número de Póliza</span>
                    <input
                      type="text"
                      value={formData.insurance_policy_number}
                      onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Información Médica */}
                  <div className="lg:col-span-3 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Información Médica</h4>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Alergias</span>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Condiciones Crónicas</span>
                    <textarea
                      value={formData.chronic_conditions}
                      onChange={(e) => setFormData({...formData, chronic_conditions: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">Medicamentos Actuales</span>
                    <textarea
                      value={formData.current_medications}
                      onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {currentPatient ? 'Actualizar' : 'Crear Paciente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && currentPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Ficha del Paciente</h3>
                <button onClick={() => { setShowDetailModal(false); setCurrentPatient(null); setDetailTab('info'); }} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {currentPatient.first_name?.charAt(0)}{currentPatient.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">
                      {currentPatient.first_name} {currentPatient.last_name}
                    </h4>
                    <p className="text-gray-500">CI: {currentPatient.cedula}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${currentPatient.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {currentPatient.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                      {currentPatient.is_email_verified && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Email Verificado</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex gap-4">
                    <button
                      onClick={() => setDetailTab('info')}
                      className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        detailTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      Información
                    </button>
                    <button
                      onClick={() => setDetailTab('appointments')}
                      className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        detailTab === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CalendarDaysIcon className="w-4 h-4" />
                      Historial de Citas ({patientAppointments.length})
                    </button>
                    <button
                      onClick={() => setDetailTab('billing')}
                      className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        detailTab === 'billing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CurrencyDollarIcon className="w-4 h-4" />
                      Facturas ({patientBillings.filter(b => b.status === 'pending').length} pendientes)
                    </button>
                  </nav>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando...</p>
                  </div>
                ) : (
                  <>
                    {/* Tab: Info */}
                    {detailTab === 'info' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-3">Información Personal</h5>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Email:</dt>
                        <dd className="text-gray-900">{currentPatient.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Teléfono:</dt>
                        <dd className="text-gray-900">{currentPatient.phone_number || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Edad:</dt>
                        <dd className="text-gray-900">{calculateAge(currentPatient.date_of_birth)} años</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Género:</dt>
                        <dd className="text-gray-900">
                          {currentPatient.gender === 'M' ? 'Masculino' : currentPatient.gender === 'F' ? 'Femenino' : 'N/A'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Tipo de Sangre:</dt>
                        <dd className="text-gray-900">{currentPatient.blood_type || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-800 mb-3">Seguro Médico</h5>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Proveedor:</dt>
                        <dd className="text-gray-900">{currentPatient.insurance_providers?.name || 'Sin seguro'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Póliza:</dt>
                        <dd className="text-gray-900">{currentPatient.insurance_number || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="col-span-2">
                    <h5 className="font-semibold text-gray-800 mb-3">Información Médica</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs font-semibold text-red-800 mb-1">Alergias</p>
                        <p className="text-sm text-red-700">{currentPatient.allergies || 'Ninguna'}</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">Condiciones Crónicas</p>
                        <p className="text-sm text-yellow-700">{currentPatient.chronic_conditions || 'Ninguna'}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Medicamentos Actuales</p>
                        <p className="text-sm text-blue-700">{currentPatient.current_medications || 'Ninguno'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h5 className="font-semibold text-gray-800 mb-3">Contacto de Emergencia</h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{currentPatient.emergency_contact || 'No registrado'}</p>
                      <p className="text-gray-500">{currentPatient.emergency_phone || ''}</p>
                    </div>
                  </div>
                </div>
                    )}

                    {/* Tab: Historial de Citas */}
                    {detailTab === 'appointments' && (
                      <div>
                        {patientAppointments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarDaysIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay citas registradas</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {patientAppointments.map((apt) => (
                              <div key={apt.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {formatDate(apt.scheduled_start)} - {new Date(apt.scheduled_start).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Dr. {apt.doctor?.first_name || apt.doctor_first_name} {apt.doctor?.last_name || apt.doctor_last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">{apt.specialty_name || apt.specialty?.name || 'N/A'}</p>
                                    {apt.reason && <p className="text-xs text-gray-400 mt-1">Motivo: {apt.reason}</p>}
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    apt.status_code === 'completed' ? 'bg-green-100 text-green-800' :
                                    apt.status_code === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    apt.status_code === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {apt.status_label || apt.status_code}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Facturas */}
                    {detailTab === 'billing' && (
                      <div>
                        {patientBillings.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay facturas registradas</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {patientBillings.map((billing) => (
                              <div key={billing.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {billing.invoice_number || `#${billing.id?.slice(0, 8)}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(billing.created_at)}
                                    </p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">
                                      ${Number.parseFloat(billing.total_amount || billing.amount || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    billing.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    billing.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {billing.status === 'paid' ? 'Pagado' :
                                     billing.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => { setShowDetailModal(false); openEditModal(currentPatient); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Editar Paciente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Desactivación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas desactivar a {currentPatient?.first_name} {currentPatient?.last_name}?
                El paciente no será eliminado permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setCurrentPatient(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
