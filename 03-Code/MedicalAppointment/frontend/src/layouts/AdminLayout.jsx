import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BeakerIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  UsersIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  BellIcon,
  StarIcon,
  EyeIcon,
  LockClosedIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  // Menu sections for better organization
  const menuSections = [
    {
      title: 'Principal',
      items: [
        { path: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { path: '/admin/calendar', icon: CalendarIcon, label: 'Recepción / Calendario' },
      ]
    },
    {
      title: 'Gestión Clínica',
      items: [
        { path: '/admin/doctors', icon: UserGroupIcon, label: 'Doctores' },
        { path: '/admin/schedules', icon: ClockIcon, label: 'Horarios y Excepciones' },
        { path: '/admin/consultation-rooms', icon: BuildingOffice2Icon, label: 'Consultorios' },
        { path: '/admin/specialties', icon: BeakerIcon, label: 'Especialidades' },
      ]
    },
    {
      title: 'Pacientes',
      items: [
        { path: '/admin/patients', icon: UsersIcon, label: 'Pacientes' },
        { path: '/admin/consultations', icon: EyeIcon, label: 'Consultas' },
        { path: '/admin/laboratory', icon: ClipboardDocumentListIcon, label: 'Laboratorio' },
      ]
    },
    {
      title: 'Administración',
      items: [
        { path: '/admin/billing', icon: CurrencyDollarIcon, label: 'Facturación' },
        { path: '/admin/insurance', icon: ShieldCheckIcon, label: 'Seguros' },
        { path: '/admin/quality', icon: StarIcon, label: 'Calidad' },
        { path: '/admin/notifications', icon: BellIcon, label: 'Notificaciones' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { path: '/admin/security', icon: LockClosedIcon, label: 'Seguridad y Accesos' },
        { path: '/admin/logs', icon: DocumentTextIcon, label: 'Auditoría' },
        { path: '/admin/profile', icon: UserCircleIcon, label: 'Mi Perfil' },
      ]
    }
  ];

  // Flatten for header title lookup
  const allMenuItems = menuSections.flatMap(section => section.items);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <img 
              src="/logo.png" 
              alt="Clínica San Miguel" 
              className="h-10 sm:h-12 object-contain"
            />
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-2">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-0.5 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                          isActive
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                {allMenuItems.find(item => item.path === location.pathname)?.label || 'Admin'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block text-gray-600 text-sm font-medium truncate max-w-[150px]">
                {user?.first_name} {user?.last_name}
              </span>
              <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500 flex-shrink-0" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
AdminLayout.propTypes = {
  children: PropTypes.node.isRequired
};