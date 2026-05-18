import React, { useState, useEffect, useCallback } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { MedicalRecordModel } from '../../models';
import { 
  BeakerIcon, 
  ArrowUpTrayIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Parámetros comunes por tipo de examen
const COMMON_TESTS = {
  'Hemograma Completo': [
    { name: 'Hemoglobina', unit: 'g/dL', range: '12.0-16.0' },
    { name: 'Hematocrito', unit: '%', range: '36-48' },
    { name: 'Glóbulos Rojos', unit: 'millones/μL', range: '4.0-5.5' },
    { name: 'Glóbulos Blancos', unit: '/μL', range: '4,500-11,000' },
    { name: 'Plaquetas', unit: '/μL', range: '150,000-400,000' },
  ],
  'Perfil Lipídico': [
    { name: 'Colesterol Total', unit: 'mg/dL', range: '<200' },
    { name: 'HDL (Bueno)', unit: 'mg/dL', range: '>40' },
    { name: 'LDL (Malo)', unit: 'mg/dL', range: '<100' },
    { name: 'Triglicéridos', unit: 'mg/dL', range: '<150' },
  ],
  'Glucosa en Ayunas': [
    { name: 'Glucosa', unit: 'mg/dL', range: '70-100' },
  ],
  'Química Sanguínea': [
    { name: 'BUN', unit: 'mg/dL', range: '7-20' },
    { name: 'Creatinina', unit: 'mg/dL', range: '0.6-1.2' },
    { name: 'Ácido Úrico', unit: 'mg/dL', range: '3.5-7.0' },
  ],
  'Urinálisis': [
    { name: 'pH', unit: '', range: '4.5-8.0' },
    { name: 'Densidad', unit: '', range: '1.005-1.030' },
    { name: 'Proteínas', unit: '', range: 'Negativo' },
    { name: 'Glucosa', unit: '', range: 'Negativo' },
  ],
};

export default function DoctorLab() {
  const [activeTab, setActiveTab] = useState('pending');
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    results: [],
    interpretation: '',
    status: 'completed'
  });
  const [submitting, setSubmitting] = useState(false);

  const loadLabOrders = useCallback(async () => {
    try {
      setLoading(true);
      const reports = await MedicalRecordModel.getDoctorLabReports();
      setLabOrders(reports || []);
    } catch (error) {
      console.error('Error loading lab orders:', error);
      showNotificationMessage('Error al cargar las órdenes de laboratorio', 'error');
      setLabOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabOrders();
  }, [loadLabOrders]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUploadResults = (order) => {
    setSelectedOrder(order);
    
    // Pre-cargar parámetros comunes si el tipo de examen es conocido
    const testType = order.test_name;
    const commonParams = COMMON_TESTS[testType] || [];
    
    setUploadData({
      results: commonParams.map(p => ({
        parameter_name: p.name,
        result_value: '',
        unit: p.unit,
        reference_range: p.range,
        status: 'normal'
      })),
      interpretation: '',
      status: 'completed'
    });
    setShowUploadModal(true);
  };

  const addParameter = () => {
    setUploadData(prev => ({
      ...prev,
      results: [...prev.results, {
        parameter_name: '',
        result_value: '',
        unit: '',
        reference_range: '',
        status: 'normal'
      }]
    }));
  };

  const removeParameter = (index) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
  };

  const updateParameter = (index, field, value) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const submitResults = async () => {
    const validResults = uploadData.results.filter(r => 
      r.parameter_name && r.result_value
    );

    if (validResults.length === 0) {
      showNotificationMessage('Ingrese al menos un resultado', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      await MedicalRecordModel.uploadLabResults(selectedOrder.id, {
        results: validResults,
        interpretation: uploadData.interpretation,
        status: uploadData.status
      });

      setShowUploadModal(false);
      setSelectedOrder(null);
      showNotificationMessage('Resultados subidos exitosamente', 'success');
      
      // Recargar datos
      loadLabOrders();
    } catch (error) {
      console.error('Error uploading results:', error);
      showNotificationMessage('Error al subir los resultados', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showNotificationMessage = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        bgColor: 'bg-yellow-100', 
        textColor: 'text-yellow-800',
        icon: ClockIcon,
        label: 'Pendiente'
      },
      completed: { 
        bgColor: 'bg-green-100', 
        textColor: 'text-green-800',
        icon: CheckCircleIcon,
        label: 'Completado'
      },
      needs_review: { 
        bgColor: 'bg-orange-100', 
        textColor: 'text-orange-800',
        icon: ExclamationTriangleIcon,
        label: 'Revisar'
      }
    };
    return configs[status] || configs.pending;
  };

  const getParameterStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'alto':
      case 'high':
        return 'bg-red-100 text-red-700 font-semibold';
      case 'bajo':
      case 'low':
        return 'bg-yellow-100 text-yellow-700 font-semibold';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.test_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const pendingCount = labOrders.filter(o => o.status === 'pending').length;
  const completedCount = labOrders.filter(o => o.status === 'completed').length;
  const needsReviewCount = labOrders.filter(o => o.status === 'needs_review').length;

  return (
    <DoctorLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <BeakerIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Laboratorio</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {pendingCount} pend. · {completedCount} compl.
              </p>
            </div>
          </div>
          <button
            onClick={loadLabOrders}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Actualizar"
          >
            <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {notification.type === 'success' 
              ? <CheckCircleIcon className="h-5 w-5" />
              : <ExclamationTriangleIcon className="h-5 w-5" />
            }
            {notification.message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100">
                <ClockIcon className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{pendingCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Completados</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{completedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-orange-100">
                <ExclamationTriangleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Por revisar</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{needsReviewCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100">
                <DocumentTextIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{labOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex overflow-x-auto gap-1 sm:gap-2 pb-1 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
            {[
              { id: 'pending', label: 'Pend.', fullLabel: 'Pendientes', count: pendingCount },
              { id: 'completed', label: 'Compl.', fullLabel: 'Completados', count: completedCount },
              { id: 'needs_review', label: 'Revisar', fullLabel: 'Por revisar', count: needsReviewCount },
              { id: 'all', label: 'Todos', fullLabel: 'Todos', count: labOrders.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
                <span className="ml-1">({tab.count})</span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Lab Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BeakerIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay órdenes de laboratorio</h3>
            <p className="text-gray-400 mt-2">
              {searchTerm ? 'No se encontraron resultados' : 'Las órdenes de laboratorio aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${statusConfig.bgColor}`}>
                          <BeakerIcon className={`w-6 h-6 ${statusConfig.textColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.test_name}</h3>
                          <p className="text-sm text-gray-600">Paciente: {order.patient_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </span>
                      </div>
                    </div>

                    {/* Results Preview (if completed) */}
                    {order.status !== 'pending' && order.lab_results?.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Resultados:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2 font-medium">Parámetro</th>
                                <th className="pb-2 font-medium">Resultado</th>
                                <th className="pb-2 font-medium">Rango</th>
                                <th className="pb-2 font-medium">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.lab_results.slice(0, 4).map((result, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-2 text-gray-800">{result.parameter_name}</td>
                                  <td className="py-2 font-medium">
                                    {result.result_value} {result.unit}
                                  </td>
                                  <td className="py-2 text-gray-500">{result.reference_range}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getParameterStatusClass(result.status)}`}>
                                      {result.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {order.lab_results.length > 4 && (
                            <p className="text-xs text-gray-500 mt-2">
                              +{order.lab_results.length - 4} parámetros más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      {order.status === 'pending' ? (
                        <button
                          onClick={() => handleUploadResults(order)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          <ArrowUpTrayIcon className="w-5 h-5" />
                          Subir Resultados
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          <EyeIcon className="w-5 h-5" />
                          Ver Detalles
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Results Modal */}
        {showUploadModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Subir Resultados de Laboratorio</h3>
                  <p className="text-sm text-gray-500">{selectedOrder.test_name} - {selectedOrder.patient_name}</p>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Test Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Examen:</span>
                      <span className="ml-2 font-medium">{selectedOrder.test_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fecha orden:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedOrder.order_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Parameters Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Parámetros del Examen</h4>
                    <button
                      onClick={addParameter}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar parámetro
                    </button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-3 font-medium text-gray-700">Parámetro</th>
                          <th className="px-4 py-3 font-medium text-gray-700">Resultado</th>
                          <th className="px-4 py-3 font-medium text-gray-700">Unidad</th>
                          <th className="px-4 py-3 font-medium text-gray-700">Rango Normal</th>
                          <th className="px-4 py-3 font-medium text-gray-700">Estado</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadData.results.map((param, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={param.parameter_name}
                                onChange={(e) => updateParameter(index, 'parameter_name', e.target.value)}
                                placeholder="Ej: Hemoglobina"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={param.result_value}
                                onChange={(e) => updateParameter(index, 'result_value', e.target.value)}
                                placeholder="Ej: 14.5"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                                placeholder="g/dL"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={param.reference_range}
                                onChange={(e) => updateParameter(index, 'reference_range', e.target.value)}
                                placeholder="12.0-16.0"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={param.status}
                                onChange={(e) => updateParameter(index, 'status', e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                  param.status === 'alto' ? 'bg-red-50 text-red-700' :
                                  param.status === 'bajo' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-green-50 text-green-700'
                                }`}
                              >
                                <option value="normal">Normal</option>
                                <option value="alto">Alto</option>
                                <option value="bajo">Bajo</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeParameter(index)}
                                className="p-1 text-gray-400 hover:text-red-600 transition"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {uploadData.results.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <p>No hay parámetros. Haga clic en "Agregar parámetro" para comenzar.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interpretation */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Interpretación / Nota del Médico
                  </span>
                  <textarea
                    value={uploadData.interpretation}
                    onChange={(e) => setUploadData({ ...uploadData, interpretation: e.target.value })}
                    placeholder="Ingrese su interpretación de los resultados, recomendaciones, o notas adicionales..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Status */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Examen
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="completed"
                        checked={uploadData.status === 'completed'}
                        onChange={(e) => setUploadData({ ...uploadData, status: e.target.value })}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm">Completado (Normal)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="needs_review"
                        checked={uploadData.status === 'needs_review'}
                        onChange={(e) => setUploadData({ ...uploadData, status: e.target.value })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm">Requiere Revisión</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={submitResults}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Guardar Resultados
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Results Modal */}
        {selectedOrder && selectedOrder.status !== 'pending' && !showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{selectedOrder.test_name}</h3>
                    <p className="text-blue-100 text-sm">{selectedOrder.patient_name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="text-white/80 hover:text-white p-2"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Orden</p>
                    <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusConfig(selectedOrder.status).bgColor} ${getStatusConfig(selectedOrder.status).textColor}`}>
                      {getStatusConfig(selectedOrder.status).label}
                    </span>
                  </div>
                </div>

                {/* Results Table */}
                {selectedOrder.lab_results?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Resultados Detallados</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Parámetro</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Resultado</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Rango Normal</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.lab_results.map((result, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-3 text-gray-800">{result.parameter_name}</td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {result.result_value} {result.unit}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{result.reference_range}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getParameterStatusClass(result.status)}`}>
                                  {result.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Doctor Notes */}
                {selectedOrder.doctor_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Nota del Médico</h4>
                    <p className="text-blue-900">{selectedOrder.doctor_notes}</p>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="bg-gray-50 border-t px-6 py-4 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
