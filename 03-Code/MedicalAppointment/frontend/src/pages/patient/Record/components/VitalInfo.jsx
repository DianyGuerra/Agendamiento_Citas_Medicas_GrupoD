/**
 * Vital information display component
 */
import PropTypes from 'prop-types';
export function VitalInfo({ medicalRecord }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Tipo de Sangre:</span>
        <span className="font-semibold text-gray-900">
          {medicalRecord?.blood_type || 'No especificado'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Altura:</span>
        <span className="font-semibold text-gray-900">
          {medicalRecord?.height ? `${medicalRecord.height} cm` : 'No especificado'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Peso:</span>
        <span className="font-semibold text-gray-900">
          {medicalRecord?.weight ? `${medicalRecord.weight} kg` : 'No especificado'}
        </span>
      </div>
    </div>
  );
}

VitalInfo.propTypes ={
  medicalRecord: PropTypes.object.isRequired,
}