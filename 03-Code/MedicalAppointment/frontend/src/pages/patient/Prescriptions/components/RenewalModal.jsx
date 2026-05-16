import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RenewalModal({ 
  prescription, 
  reason, 
  onReasonChange, 
  onSubmit, 
  onClose, 
  formatDate 
}) {
  if (!prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Solicitar Renovación</h3>
                <p className="text-purple-100 text-sm">
                  {prescription.diagnosis || 'Prescripción Médica'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Información de la Receta</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Doctor:</span> Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Fecha original:</span> {formatDate(prescription.created_at)}
            </p>
          </div>
          
          <div>
            <span className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Por qué necesitas renovar esta receta? <span className="text-red-500">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              placeholder="Ej: Necesito continuar el tratamiento porque aún no he completado la terapia..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tu doctor recibirá esta solicitud y podrá aprobarla o rechazarla.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 p-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
