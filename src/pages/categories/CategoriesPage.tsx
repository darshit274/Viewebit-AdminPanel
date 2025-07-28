import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, FolderOpen, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import api from '../../services/api';
import { categoriesService } from '../../services/categories';
import toast from 'react-hot-toast';
import { LoadingSpinner, CardSkeleton } from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/modals/ConfirmModal';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent_id: number | null;
  parent?: Category;
  icon?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  categories: Category[];
  onSuccess: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, categories, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    icon: '',
    color: '#3B82F6',
    order_index: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id?.toString() || '',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
        order_index: category.order_index || 0,
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parent_id: '',
        icon: '',
        color: '#3B82F6',
        order_index: 0,
        is_active: true
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
      };

      if (category) {
        await categoriesService.updateCategory(category.id, payload);
        toast.success('Category updated successfully');
      } else {
        await categoriesService.createCategory(payload);
        toast.success('Category created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Category save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Create Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="input-field"
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter(c => c.id !== category?.id)
                .map(c => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.parent ? `${c.parent.name} > ${c.name}` : c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon (Emoji/Symbol)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="input-field"
                placeholder="📚"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Index
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    category: null as Category | null,
    loading: false 
  });

  const [stats, setStats] = useState({
    total_categories: 0,
    active_categories: 0,
    parent_categories: 0,
    total_items: 0
  });

  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesService.getCategories({ search: searchTerm });
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await categoriesService.getCategoryStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCategories();
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setConfirmModal({ isOpen: true, category, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.category) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await categoriesService.deleteCategory(confirmModal.category.id);
      toast.success('Category deleted successfully');
      loadCategories();
      loadStats();
      setConfirmModal({ isOpen: false, category: null, loading: false });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await categoriesService.toggleCategoryStatus(category.id);
      toast.success(`Category ${category.is_active ? 'deactivated' : 'activated'} successfully`);
      loadCategories();
      loadStats();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModalSuccess = () => {
    loadCategories();
    loadStats();
  };

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap: { [key: number]: Category } = {};
    const rootCategories: Category[] = [];

    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat };
    });

    categories.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        cat.parent = categoryMap[cat.parent_id];
      }
      if (!cat.parent_id) {
        rootCategories.push(cat);
      }
    });

    return rootCategories;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Organize content with hierarchical categories</p>
        </div>
        <button 
          onClick={handleAddCategory}
          className="btn-primary inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_categories}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <ToggleRight className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_categories}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Parent Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.parent_categories}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_items}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first category.</p>
            <button onClick={handleAddCategory} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.icon || <Tag className="h-6 w-6" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {category.parent && (
                          <span className="text-gray-500 text-sm">{category.parent.name} / </span>
                        )}
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {category.item_count !== undefined && (
                          <span className="text-sm text-gray-500">
                            {category.item_count} items
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={category.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {category.is_active ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        category={selectedCategory}
        categories={categories}
        onSuccess={handleModalSuccess}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, category: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmModal.category?.name}"? ${
          confirmModal.category?.item_count 
            ? `This category contains ${confirmModal.category.item_count} items.` 
            : ''
        } This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};