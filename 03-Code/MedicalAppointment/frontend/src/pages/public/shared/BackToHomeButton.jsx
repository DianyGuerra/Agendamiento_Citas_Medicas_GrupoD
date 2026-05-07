/**
 * BackToHomeButton Component
 * Reusable button to navigate back to home page
 * 
 * @module pages/public/shared/BackToHomeButton
 */

import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Back to home navigation button
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export default function BackToHomeButton({ className = '' }) {
  const baseStyles = `
    absolute top-5 left-5 z-10 
    flex items-center gap-2 
    px-5 py-2.5 
    bg-white/95 text-primary-500 
    rounded-full font-semibold text-sm 
    shadow-lg hover:shadow-xl 
    hover:-translate-y-0.5 transition-all
  `;

  return (
    <Link to="/" className={`${baseStyles} ${className}`}>
      <ArrowLeftIcon className="w-4 h-4" />
      Inicio
    </Link>
  );
}
