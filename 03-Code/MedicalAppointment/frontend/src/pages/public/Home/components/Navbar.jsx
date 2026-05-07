/**
 * Navbar Component
 * Main navigation bar for public pages
 * 
 * @module pages/public/Home/components/Navbar
 */

import { Link } from 'react-router-dom';

/**
 * Navigation bar with logo and auth links
 * @returns {JSX.Element}
 */
export default function Navbar() {
  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <AuthButtons />
        </div>
      </div>
    </nav>
  );
}

/**
 * Logo with clinic name
 */
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-4">
      <img 
        src="/logo.png" 
        alt="Clínica San Miguel" 
        className="h-10 w-auto object-contain"
        loading="eager"
      />
      <div>
        <span className="text-xl font-bold text-gray-900 leading-none block">
          Clínica San Miguel
        </span>
        <p className="text-xs text-blue-600 font-medium mt-1">
          Tu salud, nuestra prioridad
        </p>
      </div>
    </Link>
  );
}

/**
 * Authentication navigation buttons
 */
function AuthButtons() {
  return (
    <div className="flex items-center gap-4">
      <Link 
        to="/register" 
        className="hidden sm:inline-flex px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
      >
        Registrarse
      </Link>
      <Link 
        to="/login" 
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
