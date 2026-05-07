/**
 * Medical information tab form fields
 */
export function MedicalTab({ formData, handleInputChange, insuranceProviders, loadingInsurance }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Sangre</label>
          <select
            name="blood_type"
            value={formData.blood_type}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccione</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Altura (cm)</label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor de Seguro Médico
          </label>
          <select
            name="insurance_provider_id"
            value={formData.insurance_provider_id}
            onChange={handleInputChange}
            disabled={loadingInsurance}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Sin seguro médico</option>
            {insuranceProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}{' '}
                {provider.discount_percentage > 0 && `(${provider.discount_percentage}% descuento)`}
              </option>
            ))}
          </select>
          {loadingInsurance && (
            <p className="text-sm text-gray-500 mt-1">Cargando proveedores...</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de Póliza</label>
          <input
            type="text"
            name="insurance_number"
            value={formData.insurance_number}
            onChange={handleInputChange}
            placeholder="Ingrese su número de póliza"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
          <textarea
            name="allergies"
            value={formData.allergies}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Liste todas sus alergias conocidas"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones Crónicas</label>
          <textarea
            name="medical_conditions"
            value={formData.medical_conditions}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Liste todas sus condiciones médicas crónicas"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Medicamentos Actuales</label>
          <textarea
            name="current_medications"
            value={formData.current_medications}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Liste todos los medicamentos que toma actualmente"
          />
        </div>
      </div>
    </div>
  );
}
