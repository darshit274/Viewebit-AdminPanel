import { useState, useCallback } from 'react';
import type { PaginationParams } from '../types/test-management';

interface UsePaginationReturn {
  filters: PaginationParams;
  updateFilters: (updates: Partial<PaginationParams>) => void;
  resetFilters: () => void;
  handleSearch: (search: string) => void;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
  handleSortChange: (sortBy: string, sortOrder?: 'ASC' | 'DESC') => void;
  handleStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

const DEFAULT_FILTERS: PaginationParams = {
  page: 1,
  limit: 10,
  search: '',
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'DESC',
};

export function usePagination(
  initialFilters: Partial<PaginationParams> = {}
): UsePaginationReturn {
  const [filters, setFilters] = useState<PaginationParams>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilters = useCallback((updates: Partial<PaginationParams>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      // Reset to page 1 when filters change (except when changing page itself)
      page: updates.page ?? 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
  }, [initialFilters]);

  const handleSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const handleLimitChange = useCallback((limit: number) => {
    updateFilters({ limit });
  }, [updateFilters]);

  const handleSortChange = useCallback((sortBy: string, sortOrder?: 'ASC' | 'DESC') => {
    updateFilters({ 
      sortBy, 
      sortOrder: sortOrder || (filters.sortOrder === 'ASC' ? 'DESC' : 'ASC') 
    });
  }, [filters.sortOrder, updateFilters]);

  const handleStatusChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    updateFilters({ status });
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleStatusChange,
  };
}