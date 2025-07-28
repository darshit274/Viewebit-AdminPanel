import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Play, FileText, BarChart3, Filter, Grid, List, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FreeTestCard } from '../components/freetests/FreeTestCard';
import { FreeTestModal } from '../components/modals/FreeTestModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { TestPreviewModal } from '../components/modals/TestPreviewModal';
import { PDFListSkeleton } from '../components/common/PDFSkeletonLoader';
import freeTestService, { FreeTest, FreeTestFilters, FreeTestStats } from '../services/freeTestService';
import subjectService, { Subject } from '../services/subjectService';
import toast from 'react-hot-toast';

export const FreeTestsManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [tests, setTests] = useState<FreeTest[]>([]);
  const [stats, setStats] = useState<FreeTestStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and search state
  const [filters, setFilters] = useState<FreeTestFilters>({
    search: '',
    test_type: '',
    subject_id: undefined,
    is_active: undefined,
    is_featured: undefined,
    page: 1,
    limit: 12,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Advanced filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });

  // Modal states
  const [testModal, setTestModal] = useState({ isOpen: false, test: null as FreeTest | null });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, test: null as FreeTest | null });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    test: null as FreeTest | null, 
    loading: false,
    action: 'delete' as 'delete' | 'duplicate'
  });

  // Load tests when filters change
  useEffect(() => {
    loadTests();
  }, [filters]);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadSubjects();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await freeTestService.getFreeTests(filters);
      if (response.success) {
        setTests(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Error loading tests:', error);
      toast.error('Failed to load free tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await freeTestService.getFreeTestStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getSubjects({ limit: 100 });
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  // Event handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const handleRefresh = async () => {
    await Promise.all([loadTests(), loadStats()]);
    toast.success('Data refreshed successfully');
  };

  const handleCreateTest = () => {
    setTestModal({ isOpen: true, test: null });
  };

  const handleEditTest = (test: FreeTest) => {
    setTestModal({ isOpen: true, test });
  };

  const handleDeleteTest = (test: FreeTest) => {
    setConfirmModal({ isOpen: true, test, loading: false, action: 'delete' });
  };

  const handleDuplicateTest = (test: FreeTest) => {
    setConfirmModal({ isOpen: true, test, loading: false, action: 'duplicate' });
  };

  const handleToggleStatus = async (test: FreeTest) => {
    try {
      await freeTestService.toggleTestStatus(test.id);
      toast.success(`Test ${test.is_active ? 'deactivated' : 'activated'} successfully`);
      loadTests();
      loadStats();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error('Failed to toggle test status');
    }
  };

  const handleToggleFeatured = async (test: FreeTest) => {
    try {
      await freeTestService.toggleFeaturedStatus(test.id);
      toast.success(`Test ${test.is_featured ? 'removed from' : 'added to'} featured tests`);
      loadTests();
      loadStats();
    } catch (error: any) {
      console.error('Toggle featured error:', error);
      toast.error('Failed to toggle featured status');
    }
  };

  const handleViewQuestions = (test: FreeTest) => {
    // Navigate to questions management with test filter
    navigate('/questions', { state: { testId: test.id, testTitle: test.title, testType: 'free' } });
  };

  const handleViewAnalytics = (test: FreeTest) => {
    toast.info(`Viewing analytics for ${test.title}`);
    // TODO: Navigate to analytics page
  };

  const handlePreview = (test: FreeTest) => {
    setPreviewModal({ isOpen: true, test });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.test) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      if (confirmModal.action === 'delete') {
        await freeTestService.deleteFreeTest(confirmModal.test.id);
        toast.success('Test deleted successfully');
      } else if (confirmModal.action === 'duplicate') {
        const duplicateTitle = `${confirmModal.test.title} (Copy)`;
        await freeTestService.duplicateTest(confirmModal.test.id, duplicateTitle);
        toast.success('Test duplicated successfully');
      }
      loadTests();
      loadStats();
      setConfirmModal({ isOpen: false, test: null, loading: false, action: 'delete' });
    } catch (error: any) {
      console.error('Action error:', error);
      toast.error(error.response?.data?.message || `Failed to ${confirmModal.action} test`);
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const hasActiveFilters = filters.test_type || 
                          filters.subject_id || 
                          filters.is_active !== undefined || 
                          filters.is_featured !== undefined ||
                          filters.search;

  // Render pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === pagination.page
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {pages}
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Free Tests Management</h1>
            <p className="text-gray-600 mt-2">
              Manage free practice tests, mock tests, and sample questions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleCreateTest}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <Play className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalTests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.activeTests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.featuredTests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalAttempts || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search tests by title or description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {[filters.test_type, filters.subject_id, filters.is_active, filters.is_featured, filters.search].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <select
                    value={filters.test_type || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, test_type: e.target.value as any, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="practice">Practice</option>
                    <option value="mock">Mock</option>
                    <option value="sample">Sample</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={filters.subject_id || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject_id: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                      page: 1 
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured
                  </label>
                  <select
                    value={filters.is_featured === undefined ? '' : filters.is_featured.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      is_featured: e.target.value === '' ? undefined : e.target.value === 'true',
                      page: 1 
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Tests</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Non-featured</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tests Grid */}
        {loading ? (
          <PDFListSkeleton count={filters.limit} />
        ) : tests.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <Play className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No free tests found</h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Create your first free test to get started.'}
              </p>
              <button
                onClick={handleCreateTest}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Test
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {tests.map((test) => (
              <FreeTestCard
                key={test.id}
                test={test}
                onEdit={handleEditTest}
                onDelete={handleDeleteTest}
                onDuplicate={handleDuplicateTest}
                onToggleStatus={handleToggleStatus}
                onToggleFeatured={handleToggleFeatured}
                onViewQuestions={handleViewQuestions}
                onViewAnalytics={handleViewAnalytics}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && tests.length > 0 && (
          <div className="mt-8">
            {renderPagination()}
          </div>
        )}

        {/* Modals */}
        <FreeTestModal
          isOpen={testModal.isOpen}
          onClose={() => setTestModal({ isOpen: false, test: null })}
          test={testModal.test}
          onUpdate={() => {
            loadTests();
            loadStats();
          }}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, test: null, loading: false, action: 'delete' })}
          onConfirm={handleConfirmAction}
          title={confirmModal.action === 'delete' ? 'Delete Test' : 'Duplicate Test'}
          message={
            confirmModal.action === 'delete'
              ? `Are you sure you want to delete "${confirmModal.test?.title}"? This will also delete all associated data. This action cannot be undone.`
              : `Create a duplicate of "${confirmModal.test?.title}"? The new test will be created with the same settings but marked as inactive.`
          }
          confirmText={confirmModal.action === 'delete' ? 'Delete' : 'Duplicate'}
          type={confirmModal.action === 'delete' ? 'danger' : 'primary'}
          loading={confirmModal.loading}
        />

        <TestPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, test: null })}
          test={previewModal.test}
        />
      </div>
    </div>
  );
};