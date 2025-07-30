import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ClockIcon, AcademicCapIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface SubCategory {
  id: number;
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_id: number;
}

interface Test {
  id: number;
  uuid: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_category_id: number;
  questions_count: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    subCategory: SubCategory;
    tests: Test[];
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    withQuestions: number;
  };
}

// API functions
const apiBaseUrl = 'http://localhost:5004/api/admin';

const testsApi = {
  getSubCategoryTests: async (subCategoryUuid: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse> => {
    const token = localStorage.getItem('admin_token');
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${subCategoryUuid}?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data;
  },

  createTest: async (subCategoryUuid: string, test: { title: string; description: string; duration_minutes: number; total_marks: number }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${subCategoryUuid}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateTest: async (uuid: string, test: { title: string; description: string; duration_minutes: number; total_marks: number }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteTest: async (uuid: string) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
  }
};

const SubCategoryDetailPage: React.FC = () => {
  const { subCategoryUuid } = useParams<{ subCategoryUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    duration_minutes: 60, 
    total_marks: 0 
  });

  // Filter and pagination state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Query for tests data
  const { data, isLoading, error } = useQuery({
    queryKey: ['subCategoryTests', subCategoryUuid, filters],
    queryFn: () => testsApi.getSubCategoryTests(subCategoryUuid!, filters),
    enabled: !!subCategoryUuid
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (test: { title: string; description: string; duration_minutes: number; total_marks: number }) =>
      testsApi.createTest(subCategoryUuid!, test),
    onSuccess: () => {
      toast.success('Test created successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
      setShowModal(false);
      setFormData({ title: '', description: '', duration_minutes: 60, total_marks: 0 });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create test');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: { title: string; description: string; duration_minutes: number; total_marks: number } }) =>
      testsApi.updateTest(uuid, data),
    onSuccess: () => {
      toast.success('Test updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
      setShowModal(false);
      setEditingTest(null);
      setFormData({ title: '', description: '', duration_minutes: 60, total_marks: 0 });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update test');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: testsApi.deleteTest,
    onSuccess: () => {
      toast.success('Test deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete test');
    }
  });

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTest) {
      updateMutation.mutate({ uuid: editingTest.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({ 
      title: test.title, 
      description: test.description,
      duration_minutes: test.duration_minutes,
      total_marks: test.total_marks
    });
    setShowModal(true);
  };

  const handleDelete = (uuid: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      deleteMutation.mutate(uuid);
    }
  };

  const handleViewQuestions = (testUuid: string) => {
    navigate(`/tests/${testUuid}`);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading tests</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] })}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const { data: { subCategory, tests }, pagination, stats } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-blue-600 hover:text-blue-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
          Sub-categories
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{subCategory.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subCategory.name} - Tests</h1>
            <p className="text-gray-600 mt-1">{subCategory.description}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTest(null);
            setFormData({ title: '', description: '', duration_minutes: 60, total_marks: 0 });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Test
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Questions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.withQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
              <option value="updated_at">Updated Date</option>
              <option value="duration_minutes">Duration</option>
              <option value="total_marks">Total Marks</option>
            </select>

            {/* Sort Order */}
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>

            {/* Page Size */}
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Tests List */}
        <div className="p-6">
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No tests found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Create your first test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div key={test.uuid} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{test.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{test.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>{test.total_marks} marks</span>
                        </div>
                        <span>Questions: {test.questions_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {formatDate(test.created_at)}</span>
                        <span>Updated: {formatDate(test.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewQuestions(test.uuid)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        title="View Questions"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(test)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(test.uuid)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded-md ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTest ? 'Edit Test' : 'Add Test'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTest(null);
                    setFormData({ title: '', description: '', duration_minutes: 60, total_marks: 0 });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoryDetailPage;