import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function InsuranceManagement() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discount_percentage: 0,
    coverage_types: [],
    contact_phone: '',
    contact_email: '',
    is_active: true,
  });
  
  // Coverage types options
  const coverageOptions = [
    'Consulta General',
    'Consulta Especializada',
    'Emergencias',
    'Hospitalización',
    'Cirugía',
    'Laboratorio',
    'Imagenología',
    'Medicamentos',
    'Maternidad',
    'Odontología',
  ];

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await crudApi.get('/insurance-providers');
      setProviders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
      showNotification('Error al cargar aseguradoras', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification('El nombre es requerido', 'error');
      return;
    }
    
    if (!formData.code.trim()) {
      showNotification('El código es requerido', 'error');
      return;
    }
    
    try {
      if (modalMode === 'create') {
        await crudApi.post('/insurance-providers', formData);
        showNotification('Aseguradora creada exitosamente', 'success');
      } else {
        await crudApi.put(`/insurance-providers/${selectedProvider.id}`, formData);
        showNotification('Aseguradora actualizada exitosamente', 'success');
      }
      setShowModal(false);
      resetForm();
      loadProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      showNotification(error.response?.data?.error || 'Error al guardar aseguradora', 'error');
    }
  };

  const handleEdit = (provider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name || '',
      code: provider.code || '',
      discount_percentage: provider.discount_percentage || 0,
      coverage_types: provider.coverage_types || [],
      contact_phone: provider.contact_phone || '',
      contact_email: provider.contact_email || '',
      is_active: provider.is_active !== false,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await crudApi.delete(`/insurance-providers/${selectedProvider.id}`);
      showNotification('Aseguradora eliminada', 'success');
      setShowDeleteModal(false);
      setSelectedProvider(null);
      loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      showNotification('Error al eliminar aseguradora', 'error');
    }
  };

  const toggleStatus = async (provider) => {
    try {
      await crudApi.put(`/insurance-providers/${provider.id}`, {
        is_active: !provider.is_active
      });
      loadProviders();
      showNotification(
        provider.is_active ? 'Aseguradora desactivada' : 'Aseguradora activada',
        'success'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error al actualizar estado', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      discount_percentage: 0,
      coverage_types: [],
      contact_phone: '',
      contact_email: '',
      is_active: true,
    });
    setSelectedProvider(null);
    setModalMode('create');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleCoverage = (coverage) => {
    setFormData(prev => ({
      ...prev,
      coverage_types: prev.coverage_types.includes(coverage)
        ? prev.coverage_types.filter(c => c !== coverage)
        : [...prev.coverage_types, coverage]
    }));
  };

  const filteredProviders = providers.filter(provider =>
    provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    inactive: providers.filter(p => !p.is_active).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Seguros</h2>
            <p className="text-sm sm:text-base text-gray-600">Administra las aseguradoras y sus coberturas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Aseguradora</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Activas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gray-100 rounded-full">
                <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Inactivas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aseguradora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron aseguradoras
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{provider.name}</p>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                            {provider.code}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStatus(provider)}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          provider.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {provider.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="text-green-600 font-medium">
                        {provider.discount_percentage}% desc.
                      </span>
                      {provider.contact_phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {provider.contact_phone}
                        </span>
                      )}
                    </div>
                    {(provider.coverage_types || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(provider.coverage_types || []).slice(0, 3).map((type, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {type}
                          </span>
                        ))}
                        {(provider.coverage_types || []).length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{provider.coverage_types.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(provider)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aseguradora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coberturas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProviders.map((provider) => (
                      <tr key={provider.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="font-medium text-gray-900">{provider.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {provider.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-medium">
                            {provider.discount_percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(provider.coverage_types || []).slice(0, 2).map((type, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                                {type}
                              </span>
                            ))}
                            {(provider.coverage_types || []).length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{provider.coverage_types.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {provider.contact_phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <PhoneIcon className="w-3 h-3" />
                              {provider.contact_phone}
                            </div>
                          )}
                          {provider.contact_email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <EnvelopeIcon className="w-3 h-3" />
                              {provider.contact_email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleStatus(provider)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              provider.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {provider.is_active ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(provider)}
                            className="p-1 text-gray-400 hover:text-primary-600 rounded"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProvider(provider);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
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
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">
                  {modalMode === 'create' ? 'Nueva Aseguradora' : 'Editar Aseguradora'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Seguros del Pacífico"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Ej: SDP"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Descuento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="0999999999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="contacto@aseguradora.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Cobertura
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {coverageOptions.map((coverage) => (
                      <label key={coverage} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.coverage_types.includes(coverage)}
                          onChange={() => toggleCoverage(coverage)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{coverage}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Aseguradora activa</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    {modalMode === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Eliminar Aseguradora
                </h3>
                <p className="text-gray-600">
                  ¿Está seguro de eliminar la aseguradora <strong>{selectedProvider.name}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProvider(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
