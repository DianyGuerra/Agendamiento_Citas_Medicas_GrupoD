/**
 * Security/Password tab form fields
 */
export function SecurityTab({ passwordData, handlePasswordChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
      <div className="grid grid-cols-1 gap-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual *</label>
          <input
            type="password"
            name="current_password"
            value={passwordData.current_password}
            onChange={handlePasswordChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña *</label>
          <input
            type="password"
            name="new_password"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            required
            minLength="8"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">Mínimo 8 caracteres</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
          <input
            type="password"
            name="confirm_password"
            value={passwordData.confirm_password}
            onChange={handlePasswordChange}
            required
            minLength="8"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
