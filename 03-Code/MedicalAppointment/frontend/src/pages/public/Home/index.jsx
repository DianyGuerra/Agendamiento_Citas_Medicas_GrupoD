/**
 * Home Page
 * Main landing page for the clinic website
 * 
 * @module pages/public/Home
 */

import {
  Navbar,
  HeroSection,
  FeaturesSection,
  FacilitiesSection,
  SpecialtiesSection,
  CTASection,
  Footer,
} from './components';

/**
 * Home page component
 * Orchestrates all sections of the landing page
 * @returns {JSX.Element}
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <HeroSection />
      
      <FeaturesSection />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FacilitiesSection />
        <SpecialtiesSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}
