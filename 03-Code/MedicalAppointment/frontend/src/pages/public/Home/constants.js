/**
 * Home Page Constants
 * Static data for the home page sections
 * 
 * @module pages/public/Home/constants
 */

import { 
  HeartIcon, 
  UserGroupIcon, 
  BeakerIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

/**
 * Feature cards data
 */
export const FEATURES = [
  {
    id: 'booking',
    image: '/feat-booking.png',
    title: 'Agenda Fácil',
    description: 'Reserva tus citas 100% online en segundos.',
  },
  {
    id: 'records',
    image: '/feat-records.png',
    title: 'Historial Digital',
    description: 'Accede a tu información médica centralizada.',
  },
  {
    id: 'results',
    image: '/feat-results.png',
    title: 'Resultados Online',
    description: 'Consulta tus exámenes de laboratorio al instante.',
  },
  {
    id: 'security',
    image: '/feat-security.png',
    title: 'Seguro y Privado',
    description: 'Protección total de tus datos personales.',
  },
];

/**
 * Facilities data
 */
export const FACILITIES = [
  {
    id: 'central',
    image: '/fachadaclinicasanmiguel.jpg',
    title: 'Clínica Central',
    description: 'Ubicación estratégica y accesible',
  },
  {
    id: 'team',
    image: '/personal.jpg',
    title: 'Equipo Médico',
    description: 'Especialistas certificados',
  },
  {
    id: 'tech',
    image: '/instalaciones.jpg',
    title: 'Tecnología',
    description: 'Equipamiento de última generación',
  },
];

/**
 * Medical specialties data
 */
export const SPECIALTIES = [
  { 
    id: 'cardiology',
    icon: HeartIcon, 
    title: 'Cardiología', 
    color: 'blue',
    description: 'Atención especializada con los mejores profesionales y tecnología.',
  },
  { 
    id: 'pediatrics',
    icon: UserGroupIcon, 
    title: 'Pediatría', 
    color: 'green',
    description: 'Atención especializada con los mejores profesionales y tecnología.',
  },
  { 
    id: 'laboratory',
    icon: BeakerIcon, 
    title: 'Laboratorio', 
    color: 'purple',
    description: 'Atención especializada con los mejores profesionales y tecnología.',
  },
  { 
    id: 'emergency',
    icon: ClockIcon, 
    title: 'Urgencias', 
    color: 'red',
    description: 'Atención especializada con los mejores profesionales y tecnología.',
  },
];

/**
 * Contact information
 */
export const CONTACT_INFO = {
  address: 'Av. Principal 123, Quito',
  phone: '(02) 123-4567',
  email: 'info@clinicasanmiguel.com',
};

/**
 * Business hours
 */
export const BUSINESS_HOURS = [
  { days: 'Lun - Vie', hours: '24h' },
  { days: 'Sáb - Dom', hours: 'Urgencias' },
];
