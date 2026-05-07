/**
 * FeaturesSection Component
 * Feature cards showcasing main benefits
 * 
 * @module pages/public/Home/components/FeaturesSection
 */

import { FEATURES } from '../constants';

/**
 * Features grid section
 * @returns {JSX.Element}
 */
export default function FeaturesSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-24 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual feature card
 * @param {Object} props - Feature data
 * @param {string} props.image - Image path
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 */
function FeatureCard({ image, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-all text-center group">
      <img 
        src={image} 
        alt={title} 
        className="h-24 lg:h-28 w-auto mx-auto mb-6 group-hover:scale-110 transition-transform"
        loading="lazy"
      />
      <h3 className="font-bold text-lg lg:text-xl text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 text-sm lg:text-base">{description}</p>
    </div>
  );
}
