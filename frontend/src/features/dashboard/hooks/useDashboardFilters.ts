import { useFiltersStore } from '../store/filtersStore';

export function useDashboardFilters() {
  const { filters, searchQuery, setFilters, setSearchQuery, resetFilters } = useFiltersStore();
  return {
    filters,
    searchQuery,
    setFilters,
    setSearchQuery,
    resetFilters,
  };
}

export default useDashboardFilters;
