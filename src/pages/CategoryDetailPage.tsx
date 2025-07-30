import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowLeftIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  test_series_id: number;
}

interface SubCategory {
  id: number;
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_id: number;
  tests_count: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    category: Category;
    subCategories: SubCategory[];
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
    withTests: number;
  };
}

// API functions
const apiBaseUrl = 'http://localhost:5004/api/admin';

const subCategoriesApi = {
  getCategorySubCategories: async (categoryUuid: string, params: {
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

    const response = await fetch(`${apiBaseUrl}/test-management/categories/${categoryUuid}?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data;
  },

  createSubCategory: async (categoryUuid: string, subCategory: { name: string; description: string }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/categories/${categoryUuid}/sub-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subCategory)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateSubCategory: async (uuid: string, subCategory: { name: string; description: string }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subCategory)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteSubCategory: async (uuid: string) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
  }
};

const CategoryDetailPage: React.FC = () => {
  const { categoryUuid } = useParams<{ categoryUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Filter and pagination state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Query for sub-categories data
  const { data, isLoading, error } = useQuery({
    queryKey: ['categorySubCategories', categoryUuid, filters],
    queryFn: () => subCategoriesApi.getCategorySubCategories(categoryUuid!, filters),
    enabled: !!categoryUuid
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (subCategory: { name: string; description: string }) =>
      subCategoriesApi.createSubCategory(categoryUuid!, subCategory),
    onSuccess: () => {
      toast.success('Sub-category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categorySubCategories', categoryUuid] });
      setShowModal(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create sub-category');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: { name: string; description: string } }) =>
      subCategoriesApi.updateSubCategory(uuid, data),
    onSuccess: () => {
      toast.success('Sub-category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categorySubCategories', categoryUuid] });
      setShowModal(false);
      setEditingSubCategory(null);
      setFormData({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update sub-category');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: subCategoriesApi.deleteSubCategory,
    onSuccess: () => {
      toast.success('Sub-category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categorySubCategories', categoryUuid] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete sub-category');
    }
  });

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubCategory) {
      updateMutation.mutate({ uuid: editingSubCategory.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({ name: subCategory.name, description: subCategory.description });
    setShowModal(true);
  };

  const handleDelete = (uuid: string) => {
    if (window.confirm('Are you sure you want to delete this sub-category?')) {
      deleteMutation.mutate(uuid);
    }
  };

  const handleViewTests = (subCategoryUuid: string) => {
    navigate(`/sub-categories/${subCategoryUuid}`);
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
        <div className="text-red-600 mb-4">Error loading sub-categories</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['categorySubCategories', categoryUuid] })}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const { data: { category, subCategories }, pagination, stats } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-blue-600 hover:text-blue-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
          Categories
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{category.name}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">{category.name} - Sub-categories</h1>
            <p className="text-gray-600 mt-1">{category.description}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingSubCategory(null);
            setFormData({ name: '', description: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Sub-category
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
              <p className="text-sm font-medium text-gray-600">Total Sub-categories</p>
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
              <p className="text-sm font-medium text-gray-600">With Tests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.withTests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sub-categories */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sub-categories..."
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
              <option value="name">Name</option>
              <option value="updated_at">Updated Date</option>
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

        {/* Sub-categories List */}
        <div className="p-6">
          {subCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No sub-categories found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Create your first sub-category
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subCategories.map((subCategory) => (
                <div key={subCategory.uuid} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{subCategory.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subCategory.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subCategory.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{subCategory.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Tests: {subCategory.tests_count}</span>
                        <span>Created: {formatDate(subCategory.created_at)}</span>
                        <span>Updated: {formatDate(subCategory.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewTests(subCategory.uuid)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        title="View Tests"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(subCategory)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subCategory.uuid)}
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
              {editingSubCategory ? 'Edit Sub-category' : 'Add Sub-category'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubCategory(null);
                    setFormData({ name: '', description: '' });
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

export default CategoryDetailPage;