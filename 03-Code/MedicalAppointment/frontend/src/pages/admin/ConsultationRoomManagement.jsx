import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { crudApi } from '../../services/httpClient';

// Helper para parsear equipamiento (puede venir como array o string)
const parseEquipment = (equipment) => {
  if (!equipment) return [];
  if (Array.isArray(equipment)) return equipment.filter(e => e && e.trim());
  if (typeof equipment === 'string') {
    // Intentar parsear como JSON si viene como string de array
    try {
      const parsed = JSON.parse(equipment);
      if (Array.isArray(parsed)) return parsed.filter(e => e && e.trim());
    } catch {
      // Si no es JSON, separar por comas
      return equipment.split(',').map(e => e.trim()).filter(e => e);
    }
  }
  return [];
};

export default function ConsultationRoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    floor: '',
    building: '',
    capacity: 1,
    equipment: [],
    is_available: true,
    notes: '',
  });
  const [equipmentInput, setEquipmentInput] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await crudApi.get('/consultation-rooms');
      setRooms(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      showNotification('Error al cargar las salas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await crudApi.post('/consultation-rooms', formData);
        showNotification('Sala creada exitosamente', 'success');
      } else {
        await crudApi.put(`/consultation-rooms/${selectedRoom.id}`, formData);
        showNotification('Sala actualizada exitosamente', 'success');
      }
      setShowModal(false);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      showNotification('Error al guardar la sala', 'error');
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    const parsedEquipment = parseEquipment(room.equipment);
    setFormData({
      name: room.name || '',
      room_number: room.room_number || '',
      floor: room.floor || '',
      building: room.building || '',
      capacity: room.capacity || 1,
      equipment: parsedEquipment,
      is_available: room.is_available !== false,
      notes: room.notes || '',
    });
    setEquipmentInput('');
    setModalMode('edit');
    setShowModal(true);
  };

  const addEquipmentItem = () => {
    const item = equipmentInput.trim();
    if (item && !formData.equipment.includes(item)) {
      setFormData({ ...formData, equipment: [...formData.equipment, item] });
      setEquipmentInput('');
    }
  };

  const removeEquipmentItem = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  const handleEquipmentKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEquipmentItem();
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('¿Está seguro de eliminar esta sala?')) return;
    
    try {
      await crudApi.delete(`/consultation-rooms/${roomId}`);
      showNotification('Sala eliminada', 'success');
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      showNotification('Error al eliminar la sala', 'error');
    }
  };

  const toggleAvailability = async (room) => {
    try {
      await crudApi.put(`/consultation-rooms/${room.id}`, {
        is_available: !room.is_available
      });
      loadRooms();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      room_number: '',
      floor: '',
      building: '',
      capacity: 1,
      equipment: [],
      is_available: true,
      notes: '',
    });
    setEquipmentInput('');
    setSelectedRoom(null);
    setModalMode('create');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.is_available).length,
    unavailable: rooms.filter(r => !r.is_available).length,
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Salas de Consulta</h2>
            <p className="text-sm sm:text-base text-gray-600">Gestiona las salas disponibles para consultas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Sala</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <BuildingOffice2Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
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
                <p className="text-xs sm:text-sm text-gray-500 truncate">Disponibles</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">No Disp.</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.unavailable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRooms.map((room) => {
              const equipmentList = parseEquipment(room.equipment);
              return (
                <div key={room.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Header con estado */}
                  <div className={`px-5 py-3 ${room.is_available ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BuildingOffice2Icon className="w-6 h-6 text-white" />
                        <div>
                          <h3 className="font-semibold text-white">{room.name}</h3>
                          <p className="text-xs text-white/80">Sala {room.room_number}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${room.is_available ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
                        {room.is_available ? '● Disponible' : '○ No Disponible'}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    {/* Info básica con iconos */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span>Piso {room.floor || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span>{room.capacity || 1} {room.capacity === 1 ? 'persona' : 'personas'}</span>
                      </div>
                    </div>

                    {/* Equipamiento como tags */}
                    {equipmentList.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                          <span className="font-medium">Equipamiento</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {equipmentList.map((item, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas */}
                    {room.notes && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          <span className="font-medium">Notas</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic">
                          {room.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 px-5 py-3 bg-gray-50 border-t">
                    <button
                      onClick={() => toggleAvailability(room)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        room.is_available 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {room.is_available ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron salas</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {modalMode === 'create' ? 'Nueva Sala' : 'Editar Sala'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Sala
                      </span>
                      <input
                        type="text"
                        value={formData.room_number}
                        onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Piso
                      </span>
                      <input
                        type="text"
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Edificio
                      </span>
                      <input
                        type="text"
                        value={formData.building}
                        onChange={(e) => setFormData({...formData, building: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: Number.parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Equipamiento
                    </span>
                    <div className="space-y-2">
                      {/* Tags de equipamiento */}
                      {formData.equipment.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
                          {formData.equipment.map((item, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-md"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeEquipmentItem(index)}
                                className="text-blue-600 hover:text-blue-800 ml-1"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Input para agregar */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={equipmentInput}
                          onChange={(e) => setEquipmentInput(e.target.value)}
                          onKeyDown={handleEquipmentKeyDown}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Agregar equipo"
                          style={{ fontSize: '16px' }}
                        />
                        <button
                          type="button"
                          onClick={addEquipmentItem}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Escriba el nombre del equipo y presione Enter o el botón +</p>
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </span>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="is_available" className="text-sm text-gray-700">
                      Sala disponible para consultas
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                      {modalMode === 'create' ? 'Crear' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
