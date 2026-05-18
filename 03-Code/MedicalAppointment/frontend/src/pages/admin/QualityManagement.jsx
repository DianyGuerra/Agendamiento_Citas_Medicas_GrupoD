import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import {
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  UserGroupIcon,
  HandThumbUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function QualityManagement() {
  const [ratings, setRatings] = useState([]);
  const [doctorAverages, setDoctorAverages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('ratings');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [ratingsRes, averagesRes] = await Promise.all([
        crudApi.get('/doctor-ratings'),
        crudApi.get('/doctor-ratings/averages').catch(() => ({ data: { data: [] } })),
      ]);
      setRatings(ratingsRes.data.data || ratingsRes.data || []);
      setDoctorAverages(averagesRes.data.data || averagesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRatingVisibility = async (ratingId, currentState) => {
    try {
      await crudApi.patch(`/doctor-ratings/${ratingId}`, { is_active: !currentState });
      showNotification(
        currentState ? 'Calificación ocultada' : 'Calificación visible',
        'success'
      );
      loadData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showNotification('Error al actualizar', 'error');
    }
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

  const renderStars = (rating, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolid
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  const filteredRatings = ratings.filter(rating => {
    const search = searchTerm.toLowerCase();
    const patientName = `${rating.patient?.first_name || ''} ${rating.patient?.last_name || ''}`.toLowerCase();
    const doctorName = `${rating.doctor?.first_name || ''} ${rating.doctor?.last_name || ''}`.toLowerCase();
    
    const matchesSearch = patientName.includes(search) || doctorName.includes(search);
    const matchesRating = ratingFilter === 'all' || rating.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const stats = {
    totalRatings: ratings.length,
    averageRating: ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) 
      : 0,
    positiveRatings: ratings.filter(r => r.rating >= 4).length,
    lowRatings: ratings.filter(r => r.rating <= 2).length,
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Calidad</h2>
            <p className="text-sm sm:text-base text-gray-600">Calificaciones y ranking de doctores</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('ratings')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'ratings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <StarIcon className="w-5 h-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Calificaciones</span>
              <span className="sm:hidden">Cal.</span>
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'ranking'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ranking Doctores</span>
              <span className="sm:hidden">Ranking</span>
            </button>
          </nav>
        </div>

        {activeTab === 'ratings' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                    <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalRatings}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                    <StarSolid className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Promedio</p>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <HandThumbUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Positivas</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.positiveRatings}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                    <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Bajas</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.lowRatings}</p>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar paciente o doctor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="all">Todas las estrellas</option>
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas</option>
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ratings Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : filteredRatings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <StarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron calificaciones</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {filteredRatings.map((rating) => (
                      <div key={rating.id} className={`p-3 sm:p-4 ${!rating.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              Dr. {rating.doctor?.first_name} {rating.doctor?.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              Paciente: {rating.patient?.first_name} {rating.patient?.last_name}
                            </p>
                          </div>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                            rating.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {rating.is_active ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(rating.rating, 'w-4 h-4')}
                          <span className="text-xs text-gray-500">{formatDate(rating.created_at)}</span>
                        </div>
                        
                        {rating.comment && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{rating.comment}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(rating);
                              setShowDetailModal(true);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded hover:bg-primary-100"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => toggleRatingVisibility(rating.id, rating.is_active)}
                            className={`px-3 py-1.5 text-xs rounded ${
                              rating.is_active 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {rating.is_active ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificación</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visible</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRatings.map((rating) => (
                        <tr key={rating.id} className={`hover:bg-gray-50 ${!rating.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              Dr. {rating.doctor?.first_name} {rating.doctor?.last_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {rating.patient?.first_name} {rating.patient?.last_name}
                          </td>
                          <td className="px-4 py-3">
                            {renderStars(rating.rating)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                            {rating.comment || <span className="text-gray-400 italic">Sin comentario</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(rating.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              rating.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {rating.is_active ? 'Visible' : 'Oculta'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedItem(rating);
                                  setShowDetailModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-primary-600 rounded"
                                title="Ver detalle"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => toggleRatingVisibility(rating.id, rating.is_active)}
                                className={`p-1 rounded ${
                                  rating.is_active 
                                    ? 'text-gray-400 hover:text-red-600' 
                                    : 'text-gray-400 hover:text-green-600'
                                }`}
                                title={rating.is_active ? 'Ocultar' : 'Mostrar'}
                              >
                                {rating.is_active ? (
                                  <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                  <EyeIcon className="w-5 h-5" />
                                )}
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
          </>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Ranking de Doctores por Calificación</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : doctorAverages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay datos de ranking disponibles</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {doctorAverages
                  .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
                  .map((doctor, index) => (
                    <div key={doctor.doctor_id || index} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4 hover:bg-gray-50">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{doctor.specialty_name || doctor.specialty?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2 justify-end">
                          <span className="hidden sm:flex">{renderStars(Math.round(doctor.average_rating || 0))}</span>
                          <span className="flex sm:hidden">{renderStars(Math.round(doctor.average_rating || 0), 'w-3 h-3')}</span>
                          <span className="font-bold text-gray-800 text-sm sm:text-base">
                            {(doctor.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {doctor.total_ratings || 0} <span className="hidden sm:inline">calificaciones</span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Detalle de Calificación</h3>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-center mb-4">
                  {renderStars(selectedItem.rating, 'w-6 h-6 sm:w-8 sm:h-8')}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span className="block text-xs text-gray-500">Doctor</span>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">
                      Dr. {selectedItem.doctor?.first_name} {selectedItem.doctor?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Paciente</span>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">
                      {selectedItem.patient?.first_name} {selectedItem.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Fecha</span>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDate(selectedItem.created_at)}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Estado</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedItem.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {selectedItem.is_active ? 'Visible' : 'Oculta'}
                    </span>
                  </div>
                </div>

                {selectedItem.comment && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Comentario</span>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                      {selectedItem.comment}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    toggleRatingVisibility(selectedItem.id, selectedItem.is_active);
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm sm:text-base ${
                    selectedItem.is_active
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {selectedItem.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
