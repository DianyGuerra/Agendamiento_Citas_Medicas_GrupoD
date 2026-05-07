/**
 * HeroSection Component
 * Main hero section with headline and CTA
 * 
 * @module pages/public/Home/components/HeroSection
 */

import { Link } from 'react-router-dom';

/**
 * Hero section with text and image
 * @returns {JSX.Element}
 */
export default function HeroSection() {
  return (
    <header className="relative overflow-hidden bg-white pt-10 pb-24 lg:pt-20 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HeroContent />
          <HeroImage />
        </div>
      </div>
    </header>
  );
}

/**
 * Hero text content
 */
function HeroContent() {
  return (
    <div className="text-center lg:text-left space-y-8">
      <AvailabilityBadge />
      
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
        Cuidamos de tu familia como si fuera{' '}
        <span className="text-blue-600">la nuestra</span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
        Agenda citas con especialistas, revisa resultados y gestiona tu historial 
        médico en un entorno seguro y amigable.
      </p>
      
      <HeroButtons />
    </div>
  );
}

/**
 * Availability badge indicator
 */
function AvailabilityBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
      </span>
      Atención disponible 24/7
    </div>
  );
}

/**
 * Hero call-to-action buttons
 */
function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
      <Link 
        to="/register" 
        className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all text-center"
      >
        Agendar Cita Ahora
      </Link>
      <Link 
        to="/login" 
        className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all text-center"
      >
        Ya tengo cuenta
      </Link>
    </div>
  );
}

/**
 * Hero illustration image
 */
function HeroImage() {
  return (
    <div className="relative mx-auto lg:ml-auto w-full max-w-lg lg:max-w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-blue-100/60 to-purple-100/60 rounded-full blur-3xl -z-10" />
      <img 
        src="/hero-welcome.png" 
        alt="Doctor pediatra atendiendo a familia" 
        className="w-full h-auto drop-shadow-xl hover:scale-105 transition-transform duration-700"
        loading="eager"
      />
    </div>
  );
}
