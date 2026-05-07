/**
 * FacilitiesSection Component
 * Clinic facilities showcase
 * 
 * @module pages/public/Home/components/FacilitiesSection
 */

import { FACILITIES } from '../constants';

/**
 * Facilities showcase section
 * @returns {JSX.Element}
 */
export default function FacilitiesSection() {
  return (
    <section className="mb-24">
      <SectionHeader 
        title="Nuestras Instalaciones"
        subtitle="Infraestructura moderna diseñada para tu confort"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FACILITIES.map((facility) => (
          <FacilityCard key={facility.id} {...facility} />
        ))}
      </div>
    </section>
  );
}

/**
 * Section header with title and subtitle
 * @param {Object} props - Header data
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
        {title}
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

/**
 * Individual facility card
 * @param {Object} props - Facility data
 * @param {string} props.image - Image path
 * @param {string} props.title - Facility title
 * @param {string} props.description - Facility description
 */
function FacilityCard({ image, title, description }) {
  return (
    <div className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
      <div className="overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-48 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-6 bg-white">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );
}
