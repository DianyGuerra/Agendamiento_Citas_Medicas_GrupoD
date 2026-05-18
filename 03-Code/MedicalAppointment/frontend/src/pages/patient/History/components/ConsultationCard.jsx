import { useState } from 'react';
import { CalendarIcon, UserIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DetailSection } from './DetailSection';
import PropTypes from 'prop-types';

/**
 * Card for displaying consultation history item
 */
export function ConsultationCard({ note, index, formatDate, onViewPDF }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {note.diagnosis || 'Consulta Médica'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span>{formatDate(note.scheduled_start)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <UserIcon className="h-5 w-5 text-blue-600" />
                <span>
                  Dr. {note.doctor_first_name} {note.doctor_last_name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <span>{note.specialty_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onViewPDF}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Ver PDF"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {expanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.notes && <DetailSection title="Observaciones Clínicas" content={note.notes} />}
            {note.treatment_plan && (
              <DetailSection title="Plan de Tratamiento" content={note.treatment_plan} />
            )}
            {note.prescriptions_given && (
              <DetailSection title="Medicamentos Prescritos" content={note.prescriptions_given} />
            )}
            {note.follow_up_required && note.follow_up_date && (
              <DetailSection
                title="Seguimiento"
                content={`Próxima cita: ${new Date(note.follow_up_date).toLocaleDateString('es-EC')}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ConsultationCard.propTypes = {
  note: PropTypes.object.isRequired,       
  index: PropTypes.number.isRequired,      
  formatDate: PropTypes.func.isRequired,   
  onViewPDF: PropTypes.func.isRequired,    
};
