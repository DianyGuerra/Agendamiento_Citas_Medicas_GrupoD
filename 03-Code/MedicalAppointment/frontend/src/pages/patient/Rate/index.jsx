import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRating, formatDate, getRatingLabel } from './hooks';
import { StarRating, RatingSuccess, AppointmentInfo } from './components';

export default function RateAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    submitting,
    submitted,
    error,
    appointment,
    existingRating,
    formData,
    updateFormData,
    handleSubmit,
  } = useRating(appointmentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submitted) {
    return <RatingSuccess />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Mis Citas
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-xl font-bold mb-1">Calificar Consulta</h1>
            <p className="opacity-90">Tu opinión es muy importante para nosotros</p>
          </div>

          {/* Appointment Info */}
          <AppointmentInfo appointment={appointment} formatDate={formatDate} />

          {/* Rating Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* General Rating */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Calificación General *</h3>
              <div className="flex justify-center">
                <StarRating
                  value={formData.rating}
                  onChange={(v) => updateFormData({ rating: v })}
                  size="large"
                />
              </div>
              <p className="text-center text-sm text-gray-500">{getRatingLabel(formData.rating)}</p>
            </div>

            {/* Specific Ratings */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-4">Calificaciones Específicas</h3>

              <StarRating
                label="Puntualidad"
                value={formData.punctuality_rating}
                onChange={(v) => updateFormData({ punctuality_rating: v })}
              />

              <StarRating
                label="Atención"
                value={formData.attention_rating}
                onChange={(v) => updateFormData({ attention_rating: v })}
              />

              <StarRating
                label="¿Lo recomendaría?"
                value={formData.recommendation_rating}
                onChange={(v) => updateFormData({ recommendation_rating: v })}
              />
            </div>

            {/* Comments */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => updateFormData({ comment: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="Cuéntanos tu experiencia..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Enviando...'
                : existingRating
                  ? 'Actualizar Calificación'
                  : 'Enviar Calificación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
