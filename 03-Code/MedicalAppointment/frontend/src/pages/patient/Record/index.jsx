import PatientLayout from '../../../layouts/PatientLayout';
import {
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useRecord } from './hooks';
import { RecordCard, VitalInfo } from './components';

export default function MedicalRecord() {
  const { loading, medicalRecord, error } = useRecord();

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registro Médico Completo</h1>
          <p className="text-gray-600">Vista integral de tu información médica y historial de salud</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecordCard
            icon={<HeartIcon className="h-6 w-6 text-red-600" />}
            iconBgClass="bg-red-100"
            title="Información Vital"
          >
            <VitalInfo medicalRecord={medicalRecord} />
          </RecordCard>

          <RecordCard
            icon={<BeakerIcon className="h-6 w-6 text-yellow-600" />}
            iconBgClass="bg-yellow-100"
            title="Alergias"
          >
            <p className="text-gray-700">
              {medicalRecord?.allergies || 'No se han registrado alergias'}
            </p>
          </RecordCard>

          <RecordCard
            icon={<ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />}
            iconBgClass="bg-blue-100"
            title="Condiciones Crónicas"
          >
            <p className="text-gray-700">
              {medicalRecord?.chronic_conditions || 'No se han registrado condiciones crónicas'}
            </p>
          </RecordCard>

          <RecordCard
            icon={<DocumentTextIcon className="h-6 w-6 text-green-600" />}
            iconBgClass="bg-green-100"
            title="Medicamentos Actuales"
          >
            <p className="text-gray-700">
              {medicalRecord?.current_medications || 'No se han registrado medicamentos actuales'}
            </p>
          </RecordCard>
        </div>
      </div>
    </PatientLayout>
  );
}
