import {
  BeakerIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
export default function LabResultCard({ 
  report, 
  statusConfig, 
  formatDate, 
  getParameterStatusClass, 
  onDownload, 
  onUpload 
}) {
  const StatusIcon = statusConfig.icon || CheckCircleIcon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 md:p-6 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 md:gap-4 min-w-0">
            <div className="bg-blue-600 p-2.5 md:p-3 rounded-lg flex-shrink-0">
              <BeakerIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {report.test_name || 'Examen de Laboratorio'}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-gray-600">
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{formatDate(report.order_date)}</span>
              </div>
            </div>
          </div>
          <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap flex-shrink-0 ${statusConfig.badge}`}>
            <StatusIcon className="h-4 w-4 md:h-5 md:w-5" />
            {statusConfig.label}
          </span>
        </div>
        <p className="text-gray-700 text-sm">
          <span className="font-medium">Ordenado por:</span>{' '}
          {report.doctor_full_name || 'Dr. Desconocido'}
        </p>
      </div>

      {/* Results - Cards on mobile, Table on desktop */}
      <div className="p-4 md:p-6">
        {report.lab_results && report.lab_results.length > 0 ? (
          <>
            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-3">
              {report.lab_results.map((param, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">{param.parameter_name || 'N/A'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${getParameterStatusClass(param.status)}`}>
                      {param.status || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Resultado</p>
                      <p className="font-bold text-gray-900">{param.result_value || 'N/A'} {param.unit || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rango Normal</p>
                      <p className="text-gray-600">{param.reference_range || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Parámetro</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Resultado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Rango Normal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.lab_results.map((param, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{param.parameter_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {param.result_value || 'N/A'} {param.unit || ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{param.reference_range || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getParameterStatusClass(param.status)}`}>
                          {param.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">Resultados detallados no disponibles</p>
        )}

        {/* Doctor Notes */}
        {report.doctor_notes && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">NOTA DEL MÉDICO:</p>
                <p className="text-sm text-yellow-900">{report.doctor_notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row gap-3">
        {report.status === 'pending' ? (
          <button
            onClick={onUpload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm md:text-base"
          >
            <ArrowUpTrayIcon className="h-4 w-4 md:h-5 md:w-5" />
            Subir Mis Resultados
          </button>
        ) : (
          <button
            onClick={onDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm md:text-base"
          >
            <DocumentArrowDownIcon className="h-4 w-4 md:h-5 md:w-5" />
            Descargar PDF
          </button>
        )}
      </div>
    </div>
  );
}

LabResultCard.propTypes = {
  report: PropTypes.object.isRequired,                 
  statusConfig: PropTypes.object.isRequired,           
  formatDate: PropTypes.func.isRequired,               
  getParameterStatusClass: PropTypes.func.isRequired,  
  onDownload: PropTypes.func.isRequired,               
  onUpload: PropTypes.func.isRequired,
};