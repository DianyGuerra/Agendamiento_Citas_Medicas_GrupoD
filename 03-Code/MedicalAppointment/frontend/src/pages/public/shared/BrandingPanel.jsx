/**
 * BrandingPanel Component
 * Left side branding panel for auth pages
 * 
 * @module pages/public/shared/BrandingPanel
 */

/**
 * Branding panel with logo and text
 * @param {Object} props - Component props
 * @param {string} props.title - Main title
 * @param {string} props.subtitle - Subtitle text
 * @returns {JSX.Element}
 */
export default function BrandingPanel({ 
  title = '¡Bienvenido!', 
  subtitle = 'Tu salud es nuestra prioridad' 
}) {
  return (
    <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 p-10 flex-col justify-center items-center text-white rounded-r-[100px]">
      <div className="w-64 h-44 flex items-center justify-center mb-5">
        <img 
          src="/logo.png" 
          alt="Clínica San Miguel" 
          className="max-w-[220px] max-h-[140px] object-contain rounded-lg"
          loading="lazy"
        />
      </div>
      <div className="text-center max-w-xs">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4 drop-shadow-md">
          {title}
        </h2>
        <p className="text-blue-100 text-lg">{subtitle}</p>
      </div>
    </div>
  );
}
