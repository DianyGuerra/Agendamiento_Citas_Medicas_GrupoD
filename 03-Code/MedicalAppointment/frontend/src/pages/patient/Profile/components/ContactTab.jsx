/**
 * Contact information tab form fields
 */
export function ContactTab({ formData, handleInputChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico *</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Teléfono Móvil *</span>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            maxLength="10"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Teléfono Fijo</span>
          <input
            type="tel"
            name="home_phone"
            value={formData.home_phone}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Ciudad</span>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-2">Dirección</span>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Provincia</span>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Código Postal</span>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
