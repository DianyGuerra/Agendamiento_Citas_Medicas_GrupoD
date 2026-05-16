import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
const STATUS_COLORS = {
  active: 'bg-green-100 border-green-300 text-green-800',
  expiring: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  expired: 'bg-red-100 border-red-300 text-red-800',
};

const STATUS_ICONS = {
  active: CheckCircleIcon,
  expiring: ClockIcon,
  expired: XCircleIcon,
};

export default function PrescriptionCard({ 
  prescription, 
  formatDate, 
  getDisplayDuration, 
  parseMedications, 
  getExpiryDate, 
  processLineBreaks, 
  onDownload, 
  onRenew, 
  renewalLoading, 
  hasPendingRenewal 
}) {
  const StatusIcon = STATUS_ICONS[prescription.statusInfo.class] || CheckCircleIcon;
  const medications = parseMedications(prescription.medications);
  const expiryDate = getExpiryDate(prescription);

  return (
    <div className={`border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all ${
      prescription.isActive ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className={`p-4 md:p-5 ${prescription.isActive ? 'bg-gradient-to-r from-purple-50 to-white' : 'bg-gray-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
            <div className={`${prescription.isActive ? 'bg-purple-600' : 'bg-gray-500'} p-2.5 md:p-3 rounded-xl flex-shrink-0`}>
              <BeakerIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">
                {prescription.diagnosis || 'Prescripción Médica'}
              </h3>
              <p className="text-sm text-gray-600">
                Prescrito por Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {prescription.specialty_name || 'Medicina General'}
              </p>
            </div>
          </div>

          <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold border-2 whitespace-nowrap flex-shrink-0 ${
            STATUS_COLORS[prescription.statusInfo.class]
          }`}>
            <StatusIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            {prescription.statusInfo.label}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 md:gap-2 text-purple-600 mb-1">
              <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <p className="text-xs font-semibold truncate">Fecha de emisión</p>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-900">{formatDate(prescription.created_at)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 md:gap-2 text-purple-600 mb-1">
              <ClockIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <p className="text-xs font-semibold">Duración</p>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-900">
              {getDisplayDuration(prescription)}
            </p>
          </div>

          {prescription.isActive && prescription.daysUntilExpiry !== undefined && (
            <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
              <div className="flex items-center gap-1.5 md:gap-2 text-green-600 mb-1">
                <ClockIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <p className="text-xs font-semibold">Días restantes</p>
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-900">{prescription.daysUntilExpiry} días</p>
            </div>
          )}

          {!prescription.isActive && expiryDate && (
            <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
              <div className="flex items-center gap-1.5 md:gap-2 text-red-600 mb-1">
                <XCircleIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <p className="text-xs font-semibold">Venció el</p>
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-900">
                {formatDate(expiryDate)}
              </p>
            </div>
          )}
        </div>

        {/* Medicamentos */}
        {medications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-blue-600" />
              Medicamentos
            </h4>
            <div className="space-y-3">
              {medications.map((med, index) => {
                const medName = med.medication || med.name || String(med);
                return (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-gray-800">
                        {index + 1}. {medName}
                      </p>
                      {med.dosage && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                          {med.dosage}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-3">
                      {med.frequency && <span>📅 {med.frequency}</span>}
                      {med.duration && <span>⏱ {med.duration}</span>}
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-gray-500 mt-2 italic border-l-2 border-blue-300 pl-2">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instrucciones generales */}
        {prescription.instructions && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
              Indicaciones Generales
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{processLineBreaks(prescription.instructions)}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={onDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold text-sm md:text-base"
          >
            <ArrowDownTrayIcon className="h-4 w-4 md:h-5 md:w-5" />
            Descargar Receta
          </button>
          
          {prescription.isActive && (
            hasPendingRenewal ? (
              <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-600 font-semibold text-sm md:text-base">
                <ClockIcon className="h-4 w-4 md:h-5 md:w-5" />
                Renovación Pendiente
              </div>
            ) : (
              <button
                onClick={onRenew}
                disabled={renewalLoading}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl border-2 border-purple-600 text-purple-600 transition-colors font-semibold text-sm md:text-base ${
                  renewalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'
                }`}
              >
                {renewalLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    Solicitar Renovación
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
PrescriptionCard.propTypes = {
  prescription: PropTypes.object.isRequired,        
  formatDate: PropTypes.func.isRequired,
  getDisplayDuration: PropTypes.func.isRequired,
  parseMedications: PropTypes.func.isRequired,
  getExpiryDate: PropTypes.func.isRequired,
  processLineBreaks: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  onRenew: PropTypes.func.isRequired,
  renewalLoading: PropTypes.bool.isRequired,
  hasPendingRenewal: PropTypes.bool.isRequired,
}
