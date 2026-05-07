import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Success screen after rating submission
 */
export function RatingSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu opinión!</h1>
        <p className="text-gray-600 mb-6">
          Tu calificación nos ayuda a mejorar la calidad de nuestro servicio
        </p>
        <Link
          to="/patient/appointments"
          className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Volver a Mis Citas
        </Link>
      </div>
    </div>
  );
}
