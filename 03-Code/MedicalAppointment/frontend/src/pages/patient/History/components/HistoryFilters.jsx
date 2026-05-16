import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
/**
 * Filter controls for medical history
 */
export function HistoryFilters({
  search,
  setSearch,
  year,
  setYear,
  specialty,
  setSpecialty,
  years,
  specialties,
  totalResults,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros de Búsqueda</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por doctor, especialidad o diagnóstico..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative">
          <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
          >
            <option value="">Todos los años</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
          >
            <option value="">Todas las especialidades</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
        <span className="text-sm font-semibold text-blue-700">Total de registros encontrados</span>
        <span className="text-2xl font-bold text-blue-700">{totalResults}</span>
      </div>
    </div>
  );
}
  HistoryFilters.propTypes ={
    search: PropTypes.string.isRequired,
    setSearch: PropTypes.func.isRequired,
    year: PropTypes.string.isRequired,
    setYear: PropTypes.func.isRequired,
    specialty: PropTypes.string.isRequired,
    setSpecialty: PropTypes.func.isRequired,
    years: PropTypes.array.isRequired,
    specialties: PropTypes.array.isRequired,
    totalResults: PropTypes.number.isRequired,
  };