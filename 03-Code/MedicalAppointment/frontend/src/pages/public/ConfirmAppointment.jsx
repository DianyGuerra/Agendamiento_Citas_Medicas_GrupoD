import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { AppointmentModel } from '../../models';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ConfirmAppointment() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    confirmAppointment();
  }, [appointmentId, token]);

  const confirmAppointment = async () => {
    try {
      setLoading(true);
      
      // Confirmar usando el token o el ID
      const response = await AppointmentModel.confirmPublic(appointmentId, token);
      
      if (response.data || response.appointment) {
        setAppointment(response.data || response.appointment);
        setConfirmed(true);
      }
    } catch (err) {
      console.error('Error confirming appointment:', err);
      if (err.response?.status === 404) {
        setError('Cita no encontrada o ya fue procesada.');
      } else if (err.response?.status === 400) {
        setError('Esta cita ya ha sido confirmada previamente.');
        setConfirmed(true); // Mostrar como ya confirmada
      } else {
        setError('No se pudo confirmar la cita. Por favor, intente nuevamente o contacte al consultorio.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (scheduledStart) => {
    if (!scheduledStart) return 'N/A';
    return new Date(scheduledStart).toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (scheduledStart) => {
    if (!scheduledStart) return 'N/A';
    const date = new Date(scheduledStart);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Confirmando tu cita...</h2>
          <p className="text-gray-500 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error && !confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error al Confirmar</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              to="/login"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Iniciar Sesión
            </Link>
            <Link 
              to="/"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Cita Confirmada!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu cita ha sido confirmada exitosamente
          </p>
        </div>

        {appointment && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium text-gray-800">{formatDate(appointment.scheduled_start)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Hora</p>
                <p className="font-medium text-gray-800">{formatTime(appointment.scheduled_start)}</p>
              </div>
            </div>
            {appointment.doctor && (
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium text-gray-800">
                    Dr(a). {appointment.doctor.user?.first_name} {appointment.doctor.user?.last_name}
                  </p>
                  {appointment.doctor.specialty && (
                    <p className="text-sm text-gray-500">{appointment.doctor.specialty.name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Recordatorio</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Por favor, llega 15 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Si necesitas cancelar, hazlo con 24 horas de anticipación</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            to="/login"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
          >
            Ver Mis Citas
          </Link>
          <Link 
            to="/"
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center"
          >
            Ir al Inicio
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Recibirás un recordatorio por email antes de tu cita
        </p>
      </div>
    </div>
  );
}
