/**
 * AuthLayout Component
 * Shared layout for authentication pages (Login, Register)
 * 
 * @module pages/public/shared/AuthLayout
 */

import BackToHomeButton from './BackToHomeButton';
import BrandingPanel from './BrandingPanel';
import PropTypes from 'prop-types';

/**
 * Two-column layout for auth pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form content
 * @param {string} props.brandingTitle - Title for branding panel
 * @param {string} props.brandingSubtitle - Subtitle for branding panel
 * @returns {JSX.Element}
 */
export default function AuthLayout({ 
  children, 
  brandingTitle = '¡Bienvenido!',
  brandingSubtitle = 'Tu salud es nuestra prioridad'
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Mobile: Back button outside card */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <BackToHomeButton />
      </div>
      
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl min-h-[500px] flex relative">
        {/* Desktop: Back button inside card */}
        <div className="hidden md:block">
          <BackToHomeButton />
        </div>
        
        <BrandingPanel 
          title={brandingTitle} 
          subtitle={brandingSubtitle} 
        />
        
        <div className="flex-1 p-8 pt-16 md:pt-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,            
  brandingTitle: PropTypes.string,                
  brandingSubtitle: PropTypes.string,             
};

