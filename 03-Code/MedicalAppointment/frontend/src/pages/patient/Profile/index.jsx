import PatientLayout from '../../../layouts/PatientLayout';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  HeartIcon,
  ShieldCheckIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useProfile, profileTabs } from './hooks';
import { PersonalTab, ContactTab, MedicalTab, EmergencyTab, SecurityTab } from './components';

const iconMap = {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  HeartIcon,
  ShieldCheckIcon,
};

export default function PatientProfile() {
  const {
    user,
    loading,
    notification,
    activeTab,
    setActiveTab,
    insuranceProviders,
    loadingInsurance,
    formData,
    passwordData,
    handleInputChange,
    handlePasswordChange,
    handleSubmit,
    handlePasswordSubmit,
    loadProfileData,
    resetPasswordForm,
  } = useProfile();

  if (loading && activeTab !== 'security') {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                  <CameraIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-gray-600 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {profileTabs.map((tab) => {
                const Icon = iconMap[tab.iconName];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 md:gap-2 transition-colors flex-shrink-0`}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={activeTab === 'security' ? handlePasswordSubmit : handleSubmit}>
            <div className="p-6">
              {activeTab === 'personal' && (
                <PersonalTab formData={formData} handleInputChange={handleInputChange} />
              )}
              {activeTab === 'contact' && (
                <ContactTab formData={formData} handleInputChange={handleInputChange} />
              )}
              {activeTab === 'medical' && (
                <MedicalTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  insuranceProviders={insuranceProviders}
                  loadingInsurance={loadingInsurance}
                />
              )}
              {activeTab === 'emergency' && (
                <EmergencyTab formData={formData} handleInputChange={handleInputChange} />
              )}
              {activeTab === 'security' && (
                <SecurityTab passwordData={passwordData} handlePasswordChange={handlePasswordChange} />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4 rounded-b-xl">
              <button
                type="button"
                onClick={activeTab === 'security' ? resetPasswordForm : loadProfileData}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  );
}
