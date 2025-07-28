import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner, CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { TestSeriesModal } from '../../components/modals/TestSeriesModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { TestPreviewModal } from '../../components/modals/TestPreviewModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const testSeriesService = {
  getTestSeries: async (params: any) => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/admin/test-series?${queryParams}`);
    return { data: response.data };
  },

  getTestSeriesStats: async () => {
    const response = await api.get('/admin/test-series/stats');
    return { data: response.data };
  }
};

export const TestSeriesPage: React.FC = () => {
  const location = useLocation();
  const examTypeFilter = location.state as { examTypeId?: string; examTypeName?: string } | null;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [examTypeId, setExamTypeId] = useState(examTypeFilter?.examTypeId || '');
  
  // Modal states
  const [testSeriesModal, setTestSeriesModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', testSeries: null as any });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, testSeries: null as any });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, testSeries: null as any, loading: false });

  // Clear location state after reading it
  useEffect(() => {
    if (examTypeFilter) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  const { 
    data: testSeriesResponse, 
    loading, 
    error, 
    refresh 
  } = useApi(() => testSeriesService.getTestSeries({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    exam_type_id: examTypeId
  }));

  const { 
    data: stats
  } = useApi(testSeriesService.getTestSeriesStats);

  const testSeries = testSeriesResponse?.data?.data || [];
  const pagination = testSeriesResponse?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refresh();
  };

  // CRUD handlers
  const handleAddTestSeries = () => {
    setTestSeriesModal({ isOpen: true, mode: 'create', testSeries: null });
  };

  const handleEditTestSeries = (testSeries: any) => {
    setTestSeriesModal({ isOpen: true, mode: 'edit', testSeries });
  };

  const handleDeleteTestSeries = (testSeries: any) => {
    setConfirmModal({ isOpen: true, testSeries, loading: false });
  };

  const handleToggleStatus = async (testSeries: any) => {
    try {
      await api.patch(`/admin/test-series/${testSeries.id}/toggle-status`);
      toast.success(`Test series ${testSeries.is_active ? 'deactivated' : 'activated'} successfully`);
      refresh();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      await api.delete(`/admin/test-series/${confirmModal.testSeries.id}`);
      toast.success('Test series deleted successfully');
      refresh();
      setConfirmModal({ isOpen: false, testSeries: null, loading: false });
    } catch (error: any) {
      console.error('Delete test series error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete test series');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleModalSuccess = () => {
    refresh();
  };

  const handlePreviewTestSeries = (testSeries: any) => {
    setPreviewModal({ isOpen: true, testSeries });
  };

  if (error) {
    return <ApiError error={error} onRetry={refresh} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Series Management</h1>
            <p className="text-gray-600">
              {examTypeFilter?.examTypeName 
                ? `Showing test series for ${examTypeFilter.examTypeName}`
                : 'Create and manage test series for students'}
            </p>
          </div>
          <button 
            onClick={handleAddTestSeries}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test Series
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Series</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.total_series || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <ToggleRight className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Series</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.active_series || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Plus className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Free Series</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.free_series || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Edit className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Series</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.paid_series || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Test Series
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>
            
            {examTypeId && (
              <button 
                type="button" 
                onClick={() => {
                  setExamTypeId('');
                  refresh();
                }}
                className="btn-secondary"
              >
                Clear Filter
              </button>
            )}
          </form>
        </div>

        {/* Test Series Table */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Test Series List</h3>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: pageSize }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : testSeries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                <Eye className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No test series found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first test series.</p>
              <button onClick={handleAddTestSeries} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Test Series
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testSeries.map((series: any) => (
                    <tr key={series.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{series.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{series.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {series.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {series.price === 0 ? 'Free' : `₹${series.price}`}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{series.total_tests || 0}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          series.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {series.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {new Date(series.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handlePreviewTestSeries(series)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Preview Test Series"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditTestSeries(series)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditTestSeries(series)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Test Series"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(series)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title={series.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {series.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteTestSeries(series)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Test Series"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <TestSeriesModal
          isOpen={testSeriesModal.isOpen}
          onClose={() => setTestSeriesModal({ isOpen: false, mode: 'create', testSeries: null })}
          onSuccess={handleModalSuccess}
          testSeries={testSeriesModal.testSeries}
          mode={testSeriesModal.mode}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, testSeries: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Test Series"
          message={`Are you sure you want to delete "${confirmModal.testSeries?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />

        <TestPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, testSeries: null })}
          test={previewModal.testSeries}
        />
      </div>
    </ErrorBoundary>
  );
};