/**
 * Footer Component
 * Site footer with contact and links
 * 
 * @module pages/public/Home/components/Footer
 */

import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CONTACT_INFO, BUSINESS_HOURS } from '../constants';

/**
 * Site footer
 * @returns {JSX.Element}
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-12 lg:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <BrandColumn />
          <QuickLinksColumn />
          <ContactColumn />
          <HoursColumn />
        </div>
        <Copyright year={currentYear} />
      </div>
    </footer>
  );
}

/**
 * Brand/logo column
 */
function BrandColumn() {
  return (
    <div className="sm:col-span-2 lg:col-span-1">
      <div className="flex items-center gap-3 mb-6">
        <img 
          src="/logo.png" 
          alt="Logo Clínica San Miguel" 
          className="h-10 w-auto"
          loading="lazy"
        />
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        Comprometidos con la excelencia médica y el trato humano.
      </p>
    </div>
  );
}

/**
 * Quick navigation links column
 */
function QuickLinksColumn() {
  return (
    <div>
      <h3 className="font-bold text-lg mb-6">Accesos Rápidos</h3>
      <ul className="space-y-3 text-gray-400 text-sm">
        <li>
          <Link to="/login" className="hover:text-white transition-colors">
            Portal de Pacientes
          </Link>
        </li>
        <li>
          <Link to="/register" className="hover:text-white transition-colors">
            Crear Cuenta
          </Link>
        </li>
      </ul>
    </div>
  );
}

/**
 * Contact information column
 */
function ContactColumn() {
  return (
    <div>
      <h3 className="font-bold text-lg mb-6">Contacto</h3>
      <ul className="space-y-3 text-gray-400 text-sm">
        <li>{CONTACT_INFO.address}</li>
        <li>{CONTACT_INFO.phone}</li>
        <li>{CONTACT_INFO.email}</li>
      </ul>
    </div>
  );
}

/**
 * Business hours column
 */
function HoursColumn() {
  return (
    <div>
      <h3 className="font-bold text-lg mb-6">Horarios</h3>
      <ul className="space-y-3 text-gray-400 text-sm">
        {BUSINESS_HOURS.map((schedule, index) => (
          <li key={index} className="flex justify-between max-w-[140px]">
            <span>{schedule.days}:</span>
            <span>{schedule.hours}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Copyright notice
 * @param {Object} props - Component props
 * @param {number} props.year - Current year
 */
function Copyright({ year }) {
  return (
    <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
      <p>© {year} Clínica San Miguel. Todos los derechos reservados.</p>
    </div>
  );
}

Copyright.propTypes = {
  year: PropTypes.number.isRequired,   
};

