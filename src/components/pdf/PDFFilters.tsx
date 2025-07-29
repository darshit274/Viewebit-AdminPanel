import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { PDFFilters as PDFFiltersType, PDFCategory } from '../../services/pdfService';

interface PDFFiltersProps {
  filters: PDFFiltersType;
  onFiltersChange: (filters: PDFFiltersType) => void;
  categories: PDFCategory[];
  examTypes: Array<{ id: number; name: string }>;
  testSeries: Array<{ id: string; title: string }>;
  loading?: boolean;
}

export const PDFFilters: React.FC<PDFFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  examTypes,
  testSeries,
  loading = false
}) => {
  const [localFilters, setLocalFilters] = useState<PDFFiltersType>(filters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (key: keyof PDFFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    // Debounce search input
    if (key === 'search') {
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...newFilters, page: 1 });
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      onFiltersChange({ ...newFilters, page: 1 });
    }
  };

  const handleReset = () => {
    const resetFilters: PDFFiltersType = {
      search: '',
      category_id: '',
      access_level: '',
      exam_type_id: '',
      test_series_id: '',
      sort_by: 'created_at',
      sort_order: 'DESC',
      page: 1,
      limit: 12
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsAdvancedOpen(false);
  };

  const handleSearch = () => {
    onFiltersChange({ ...localFilters, page: 1 });
  };

  const hasActiveFilters = localFilters.category_id || 
                          localFilters.access_level || 
                          localFilters.exam_type_id || 
                          localFilters.test_series_id ||
                          localFilters.search;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Main Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Search PDFs by title or description..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
            isAdvancedOpen || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
          disabled={loading}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {[localFilters.category_id, localFilters.access_level, localFilters.exam_type_id, localFilters.test_series_id, localFilters.search].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={localFilters.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.pdf_count !== undefined && `(${category.pdf_count})`}
                  </option>
                )) : (
                  <option value="" disabled>Loading categories...</option>
                )}
              </select>
            </div>

            {/* Access Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                value={localFilters.access_level || ''}
                onChange={(e) => handleInputChange('access_level', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Levels</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            {/* Exam Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                value={localFilters.exam_type_id || ''}
                onChange={(e) => handleInputChange('exam_type_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Exam Types</option>
                {Array.isArray(examTypes) && examTypes.length > 0 ? examTypes.map((examType) => (
                  <option key={examType.id} value={examType.id}>
                    {examType.name}
                  </option>
                )) : (
                  <option value="" disabled>Loading exam types...</option>
                )}
              </select>
            </div>

            {/* Test Series Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Series
              </label>
              <select
                value={localFilters.test_series_id || ''}
                onChange={(e) => handleInputChange('test_series_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Test Series</option>
                {Array.isArray(testSeries) && testSeries.length > 0 ? testSeries.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.title}
                  </option>
                )) : (
                  <option value="" disabled>Loading test series...</option>
                )}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={localFilters.sort_by || 'created_at'}
                onChange={(e) => handleInputChange('sort_by', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="created_at">Upload Date</option>
                <option value="title">Title</option>
                <option value="download_count">Downloads</option>
                <option value="file_size">File Size</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={localFilters.sort_order || 'DESC'}
                onChange={(e) => handleInputChange('sort_order', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};