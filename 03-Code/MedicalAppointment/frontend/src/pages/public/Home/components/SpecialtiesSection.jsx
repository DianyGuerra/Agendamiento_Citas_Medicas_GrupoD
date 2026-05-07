/**
 * SpecialtiesSection Component
 * Medical specialties showcase
 * 
 * @module pages/public/Home/components/SpecialtiesSection
 */

import { SPECIALTIES } from '../constants';

/**
 * Color mapping for Tailwind classes
 * Note: Full classes needed for Tailwind JIT compilation
 */
const COLOR_CLASSES = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
};

/**
 * Medical specialties grid section
 * @returns {JSX.Element}
 */
export default function SpecialtiesSection() {
  return (
    <section className="mb-24">
      <SectionHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SPECIALTIES.map((specialty) => (
          <SpecialtyCard key={specialty.id} {...specialty} />
        ))}
      </div>
    </section>
  );
}

/**
 * Section header
 */
function SectionHeader() {
  return (
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
        Especialidades Médicas
      </h2>
      <p className="text-gray-600 max-w-xl mx-auto">
        Atención integral cubriendo todas tus necesidades de salud.
      </p>
    </div>
  );
}

/**
 * Individual specialty card
 * @param {Object} props - Specialty data
 * @param {React.ComponentType} props.icon - Icon component
 * @param {string} props.title - Specialty title
 * @param {string} props.color - Color theme
 * @param {string} props.description - Specialty description
 */
function SpecialtyCard({ icon: Icon, title, color, description }) {
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  
  return (
    <div className={`p-6 lg:p-8 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-b-4 ${colors.border} group`}>
      <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className={`h-6 w-6 lg:h-8 lg:w-8 ${colors.text}`} />
      </div>
      <h3 className="font-bold text-lg lg:text-xl mb-3 text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
