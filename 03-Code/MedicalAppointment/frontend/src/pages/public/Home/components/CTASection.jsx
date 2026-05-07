/**
 * CTASection Component
 * Call-to-action section for appointment booking
 * 
 * @module pages/public/Home/components/CTASection
 */

import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Call-to-action section
 * @returns {JSX.Element}
 */
export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-blue-600 rounded-3xl shadow-2xl my-20">
      <BackgroundPattern />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10 p-8 md:p-12 lg:p-16">
        <CTAContent />
        <CTAImage />
      </div>
    </section>
  );
}

/**
 * Background decorative pattern
 */
function BackgroundPattern() {
  return (
    <div 
      className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" 
      aria-hidden="true"
    />
  );
}

/**
 * CTA text content
 */
function CTAContent() {
  return (
    <div className="text-center md:text-left">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
        Tu tiempo es valioso,
        <br />
        agenda en segundos
      </h2>
      <p className="text-blue-100 text-base lg:text-lg mb-8 max-w-md mx-auto md:mx-0">
        Nuestro sistema inteligente te permite encontrar el horario perfecto 
        con tu doctor preferido al instante.
      </p>
      <Link 
        to="/register" 
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-bold text-base lg:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
      >
        <CheckCircleIcon className="h-5 w-5 lg:h-6 lg:w-6" />
        Agendar mi cita
      </Link>
    </div>
  );
}

/**
 * CTA illustration image
 */
function CTAImage() {
  return (
    <div className="relative flex justify-center md:justify-end">
      <img 
        src="/cta-schedule.png" 
        alt="Doctor feliz señalando calendario" 
        className="w-full max-w-sm md:max-w-md h-auto object-contain rounded-2xl shadow-lg hover:rotate-2 transition-transform duration-500"
        loading="lazy"
      />
    </div>
  );
}
