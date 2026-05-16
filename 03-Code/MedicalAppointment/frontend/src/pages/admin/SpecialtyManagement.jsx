import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { SpecialtyModel } from '../../models';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function SpecialtyManagement() {
  const [specialties, setSpecialties] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', consultation_fee: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [specialtiesRes, statsRes] = await Promise.all([
        SpecialtyModel.getAll(),
        SpecialtyModel.getStats(),
      ]);
      
      setSpecialties(specialtiesRes.data || specialtiesRes);
      setStats(statsRes.data || statsRes);
    } catch (error) {
      showNotification('Error al cargar especialidades', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentSpecialty) {
        await SpecialtyModel.update(currentSpecialty.id, formData);
        showNotification('Especialidad actualizada exitosamente', 'success');
      } else {
        await SpecialtyModel.create(formData);
        showNotification('Especialidad creada exitosamente', 'success');
      }
      
      closeModal();
      loadData();
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al guardar especialidad',
        'error'
      );
    }
  };

  const handleDelete = async () => {
    try {
      await SpecialtyModel.delete(currentSpecialty.id);
      showNotification('Especialidad eliminada exitosamente', 'success');
      setShowDeleteModal(false);
      setCurrentSpecialty(null);
      loadData();
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al eliminar especialidad',
        'error'
      );
    }
  };

  const openAddModal = () => {
    setCurrentSpecialty(null);
    setFormData({ name: '', description: '', consultation_fee: '' });
    setShowModal(true);
  };

  const openEditModal = (specialty) => {
    setCurrentSpecialty(specialty);
    setFormData({ 
      name: specialty.name, 
      description: specialty.description || '',
      consultation_fee: specialty.consultation_fee || ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (specialty) => {
    setCurrentSpecialty(specialty);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentSpecialty(null);
    setFormData({ name: '', description: '', consultation_fee: '' });
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredSpecialties = specialties.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <StatsCard
          title="Total"
          value={stats.total || 0}
          color="blue"
        />
        <StatsCard
          title="Activas"
          value={stats.active || 0}
          color="green"
        />
        <StatsCard
          title="Con Doctores"
          value={stats.withDoctors || 0}
          color="yellow"
        />
        <StatsCard
          title="Nuevas Este Mes"
          value={stats.newThisMonth || 0}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Agregar Especialidad</span>
            <span className="sm:hidden">Agregar</span>
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden bg-white rounded-xl shadow-md overflow-hidden">
        {filteredSpecialties.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            No se encontraron especialidades
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSpecialties.map((specialty) => (
              <div key={specialty.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{specialty.name}</p>
                    <p className="text-sm text-gray-600 truncate">{specialty.description || 'Sin descripción'}</p>
                  </div>
                  {specialty.consultation_fee && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs flex-shrink-0 ml-2">
                      <CurrencyDollarIcon className="w-3 h-3" />
                      {Number.parseFloat(specialty.consultation_fee).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(specialty)}
                    className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => openDeleteModal(specialty)}
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

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Descripción</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Fee Consulta</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSpecialties.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron especialidades
                  </td>
                </tr>
              ) : (
                filteredSpecialties.map((specialty) => (
                  <tr key={specialty.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{specialty.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {specialty.description || <span className="italic text-gray-400">Sin descripción</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {specialty.consultation_fee ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          {Number.parseFloat(specialty.consultation_fee).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No definido</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(specialty)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(specialty)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {currentSpecialty ? 'Editar Especialidad' : 'Agregar Especialidad'}
              </h2>
              <button onClick={closeModal} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Especialidad <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Cardiología"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </span>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la especialidad (opcional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Fee de Consulta ($)
                </span>
                <div className="relative">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    placeholder="Ej: 50.00"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Precio base por consulta de esta especialidad</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors shadow-md hover:shadow-lg"
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
                ¿Está seguro que desea eliminar la especialidad <strong>{currentSpecialty?.name}</strong>?
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
    </AdminLayout>
  );
}

function StatsCard({ title, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform`}>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{value}</div>
      <div className="text-xs sm:text-sm opacity-90">{title}</div>
    </div>
  );
}