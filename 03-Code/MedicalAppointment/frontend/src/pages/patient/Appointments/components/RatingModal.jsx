/**
 * RatingModal Component
 * Modal for rating a completed appointment
 */
import { useState } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

function StarRatingInput({ value, onChange, label }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            {star <= value ? (
              <StarSolidIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-200" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function InlineStarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          {star <= value ? (
            <StarSolidIcon className="w-6 h-6 text-yellow-400" />
          ) : (
            <StarIcon className="w-6 h-6 text-gray-300 hover:text-yellow-200" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function RatingModal({ appointment, onSubmit, onClose }) {
  const [ratingData, setRatingData] = useState({
    rating: 0,
    punctuality_rating: 0,
    attention_rating: 0,
    recommendation_rating: 0,
    comment: '',
    is_anonymous: false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (ratingData.rating === 0) return;

    setSubmitting(true);
    const success = await onSubmit({
      doctor_id: appointment.doctor_id,
      appointment_id: appointment.id,
      rating: ratingData.rating,
      punctuality_rating: ratingData.punctuality_rating || null,
      attention_rating: ratingData.attention_rating || null,
      recommendation_rating: ratingData.recommendation_rating || null,
      comment: ratingData.comment || null,
      is_anonymous: ratingData.is_anonymous
    });
    setSubmitting(false);
    
    if (success) {
      onClose();
    }
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Calificar Consulta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Doctor Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
              </p>
              <p className="text-sm text-gray-600">{appointment.specialty_name}</p>
              <p className="text-xs text-gray-500">
                {new Date(appointment.scheduled_start).toLocaleDateString('es-EC', {
                  dateStyle: 'long'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Calificación General *</p>
            <StarRatingInput 
              value={ratingData.rating} 
              onChange={(val) => setRatingData({...ratingData, rating: val})} 
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Puntualidad</span>
              <InlineStarRating
                value={ratingData.punctuality_rating}
                onChange={(val) => setRatingData({...ratingData, punctuality_rating: val})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Atención</span>
              <InlineStarRating
                value={ratingData.attention_rating}
                onChange={(val) => setRatingData({...ratingData, attention_rating: val})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">¿Lo recomendarías?</span>
              <InlineStarRating
                value={ratingData.recommendation_rating}
                onChange={(val) => setRatingData({...ratingData, recommendation_rating: val})}
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={ratingData.comment}
              onChange={(e) => setRatingData({...ratingData, comment: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Cuéntanos tu experiencia..."
            />
          </div>

          {/* Anonymous Option */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ratingData.is_anonymous}
              onChange={(e) => setRatingData({...ratingData, is_anonymous: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Publicar como anónimo</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || ratingData.rating === 0}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
              submitting || ratingData.rating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <StarSolidIcon className="h-5 w-5" />
                Enviar Calificación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
