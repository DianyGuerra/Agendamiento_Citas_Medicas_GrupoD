import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export default function UploadModal({
  selectedReport,
  uploadData,
  setUploadData,
  submitting,
  formatDate,
  addParameter,
  removeParameter,
  updateParameter,
  onSubmit,
  onClose,
}) {
  if (!selectedReport) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Subir Resultados de Laboratorio</h3>
            <p className="text-green-100 text-sm">{selectedReport.test_name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Exam Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Examen:</span>
                <span className="ml-2 font-semibold text-gray-900">{selectedReport.test_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Ordenado por:</span>
                <span className="ml-2 font-semibold text-gray-900">{selectedReport.doctor_full_name || 'Dr. Desconocido'}</span>
              </div>
              <div>
                <span className="text-gray-600">Fecha de orden:</span>
                <span className="ml-2 font-semibold text-gray-900">{formatDate(selectedReport.order_date)}</span>
              </div>
            </div>
          </div>

          {/* Lab Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Laboratorio (opcional)
            </label>
            <input
              type="text"
              value={uploadData.lab_name}
              onChange={(e) => setUploadData({ ...uploadData, lab_name: e.target.value })}
              placeholder="Ej: Laboratorio San José"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Parameters Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">Resultados del Examen *</h4>
              <button
                onClick={addParameter}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar parámetro
              </button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-3 font-medium text-gray-700">Parámetro</th>
                    <th className="px-3 py-3 font-medium text-gray-700">Resultado</th>
                    <th className="px-3 py-3 font-medium text-gray-700">Unidad</th>
                    <th className="px-3 py-3 font-medium text-gray-700">Rango</th>
                    <th className="px-3 py-3 font-medium text-gray-700">Estado</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.results.map((param, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={param.parameter_name}
                          onChange={(e) => updateParameter(index, 'parameter_name', e.target.value)}
                          placeholder="Hemoglobina"
                          className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={param.result_value}
                          onChange={(e) => updateParameter(index, 'result_value', e.target.value)}
                          placeholder="14.5"
                          className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none font-medium"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                          placeholder="g/dL"
                          className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={param.reference_range}
                          onChange={(e) => updateParameter(index, 'reference_range', e.target.value)}
                          placeholder="12-16"
                          className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={param.status}
                          onChange={(e) => updateParameter(index, 'status', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
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
                      <td className="px-3 py-2">
                        {uploadData.results.length > 1 && (
                          <button
                            onClick={() => removeParameter(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              value={uploadData.notes}
              onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
              placeholder="Cualquier información adicional sobre el examen..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
            />
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                Subir Examen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
