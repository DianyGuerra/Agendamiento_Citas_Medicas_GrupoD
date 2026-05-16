import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import {
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function LaboratoryManagement() {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Result form
  const [resultForm, setResultForm] = useState({
    results: [],
    notes: '',
  });

  useEffect(() => {
    loadLabOrders();
  }, [statusFilter, dateFilter]);

  const loadLabOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      
      // Use admin-specific endpoint
      const response = await crudApi.get('/medical-records/lab-reports/all', { params });
      setLabOrders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading lab orders:', error);
      setLabOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await crudApi.patch(`/medical-records/lab-reports/${orderId}/status`, { status: newStatus });
      showNotification('Estado actualizado', 'success');
      loadLabOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error al actualizar estado', 'error');
    }
  };

  const saveResults = async () => {
    if (!selectedOrder) return;
    
    try {
      await crudApi.post(`/medical-records/lab-reports/${selectedOrder.id}/results`, {
        results: resultForm.results,
        notes: resultForm.notes,
      });
      showNotification('Resultados guardados exitosamente', 'success');
      setShowResultModal(false);
      setSelectedOrder(null);
      loadLabOrders();
    } catch (error) {
      console.error('Error saving results:', error);
      showNotification('Error al guardar resultados', 'error');
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openResultModal = (order) => {
    setSelectedOrder(order);
    setResultForm({
      results: order.lab_results || [
        { parameter_name: '', result_value: '', unit: '', reference_range: '', status: 'normal' }
      ],
      notes: order.doctor_notes || '',
    });
    setShowResultModal(true);
  };

  const addResultRow = () => {
    setResultForm(prev => ({
      ...prev,
      results: [...prev.results, { parameter_name: '', result_value: '', unit: '', reference_range: '', status: 'normal' }]
    }));
  };

  const removeResultRow = (index) => {
    setResultForm(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
  };

  const updateResultRow = (index, field, value) => {
    setResultForm(prev => ({
      ...prev,
      results: prev.results.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En proceso' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getResultStatusBadge = (status) => {
    const styles = {
      normal: 'bg-green-100 text-green-800',
      abnormal: 'bg-red-100 text-red-800',
      borderline: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || styles.normal;
  };

  const filteredOrders = labOrders.filter(order => {
    const search = searchTerm.toLowerCase();
    const patientName = (order.patient_name || '').toLowerCase();
    const testName = (order.test_name || '').toLowerCase();
    const doctorName = (order.doctor_name || '').toLowerCase();
    return patientName.includes(search) || testName.includes(search) || doctorName.includes(search);
  });

  const stats = {
    total: labOrders.length,
    pending: labOrders.filter(o => o.status === 'pending').length,
    processing: labOrders.filter(o => o.status === 'processing' || o.status === 'in_progress').length,
    completed: labOrders.filter(o => o.status === 'completed').length,
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Laboratorio</h2>
            <p className="text-sm sm:text-base text-gray-600">Órdenes de exámenes y registro de resultados</p>
          </div>
          <button
            onClick={loadLabOrders}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total Órdenes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ExclamationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">En Proceso</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Completados</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente o examen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="processing">En proceso</option>
                <option value="completed">Completados</option>
              </select>
              
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron órdenes de laboratorio</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {order.patient_name || 'Paciente desconocido'}
                        </p>
                        <p className="text-sm text-gray-500">{order.test_name}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Doctor</p>
                        <p className="text-gray-700 truncate">{order.doctor_name || 'Doctor desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fecha</p>
                        <p className="text-gray-700">{formatDate(order.order_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => openDetailModal(order)}
                        className="flex-1 flex items-center justify-center gap-1 p-2 text-gray-600 hover:text-primary-600 rounded bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-xs">Ver</span>
                      </button>
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => openResultModal(order)}
                          className="flex-1 flex items-center justify-center gap-1 p-2 text-green-600 hover:bg-green-50 rounded bg-gray-50"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          <span className="text-xs">Resultados</span>
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          className="flex-1 flex items-center justify-center p-2 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Iniciar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Examen</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Orden</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {order.patient_name || 'Paciente desconocido'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{order.test_name}</div>
                        {order.doctor_notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {order.doctor_notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {order.doctor_name || 'Doctor desconocido'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailModal(order)}
                            className="p-1 text-gray-400 hover:text-primary-600 rounded"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          {order.status !== 'completed' && (
                            <button
                              onClick={() => openResultModal(order)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="Registrar resultados"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                          )}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              Iniciar
                            </button>
                          )}
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

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Detalle de Orden</h3>
                {getStatusBadge(selectedOrder.status)}
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-gray-500">Paciente</span>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.patient?.first_name} {selectedOrder.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Doctor Solicitante</span>
                    <p className="font-medium text-gray-800">
                      Dr. {selectedOrder.doctor?.first_name} {selectedOrder.doctor?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Examen</span>
                    <p className="font-medium text-gray-800">{selectedOrder.test_name}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Fecha de Orden</span>
                    <p className="font-medium text-gray-800">{formatDate(selectedOrder.order_date)}</p>
                  </div>
                </div>

                {selectedOrder.doctor_notes && (
                  <div>
                    <span className="block text-xs text-gray-500">Notas del Doctor</span>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                      {selectedOrder.doctor_notes}
                    </p>
                  </div>
                )}

                {selectedOrder.lab_results && selectedOrder.lab_results.length > 0 && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-2">Resultados</span>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs text-gray-500">Parámetro</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500">Resultado</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500">Unidad</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500">Rango Ref.</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.lab_results.map((result, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-medium">{result.parameter_name}</td>
                              <td className="px-3 py-2">{result.result_value}</td>
                              <td className="px-3 py-2 text-gray-500">{result.unit}</td>
                              <td className="px-3 py-2 text-gray-500">{result.reference_range}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getResultStatusBadge(result.status)}`}>
                                  {result.status === 'normal' ? 'Normal' : result.status === 'abnormal' ? 'Anormal' : 'Límite'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                {selectedOrder.status === 'completed' && (
                  <button
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Imprimir
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result Entry Modal */}
        {showResultModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Registrar Resultados</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedOrder.test_name} - {selectedOrder.patient?.first_name} {selectedOrder.patient?.last_name}
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="block text-sm font-medium text-gray-700">Parámetros</span>
                    <button
                      type="button"
                      onClick={addResultRow}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      + Agregar parámetro
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {resultForm.results.map((result, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Parámetro"
                          value={result.parameter_name}
                          onChange={(e) => updateResultRow(index, 'parameter_name', e.target.value)}
                          className="col-span-3 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Resultado"
                          value={result.result_value}
                          onChange={(e) => updateResultRow(index, 'result_value', e.target.value)}
                          className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Unidad"
                          value={result.unit}
                          onChange={(e) => updateResultRow(index, 'unit', e.target.value)}
                          className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Rango ref."
                          value={result.reference_range}
                          onChange={(e) => updateResultRow(index, 'reference_range', e.target.value)}
                          className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <select
                          value={result.status}
                          onChange={(e) => updateResultRow(index, 'status', e.target.value)}
                          className="col-span-2 border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Anormal</option>
                          <option value="borderline">Límite</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeResultRow(index)}
                          className="col-span-1 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </span>
                  <textarea
                    value={resultForm.notes}
                    onChange={(e) => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveResults}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Guardar y Completar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
