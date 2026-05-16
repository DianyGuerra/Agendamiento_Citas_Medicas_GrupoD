/**
 * Emergency contact tab form fields
 */
export function EmergencyTab({ formData, handleInputChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</span>
          <input
            type="text"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Relación</span>
          <input
            type="text"
            name="emergency_contact_relation"
            value={formData.emergency_contact_relation}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Padre, Madre, Esposo/a"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Teléfono</span >
          <input
            type="tel"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleInputChange}
            maxLength="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
