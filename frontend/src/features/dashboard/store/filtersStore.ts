import { create } from 'zustand';
import { DashboardFilters } from '../types';

interface FiltersState {
  filters: DashboardFilters;
  searchQuery: string;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const initialFilters: DashboardFilters = {
  timeRange: '24h',
  organizationId: null,
  environment: 'all',
  service: null,
  severity: 'all',
  assignedTeam: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  filters: initialFilters,
  searchQuery: '',
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () => set({ filters: initialFilters, searchQuery: '' }),
}));

export default useFiltersStore;
