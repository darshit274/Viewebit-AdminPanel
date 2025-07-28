import api from './api';

export interface Category {
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

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  parent_categories: number;
  total_items: number;
}

export const categoriesService = {
  // Get all categories
  getCategories: async (params?: { search?: string; parent_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.parent_id) queryParams.append('parent_id', params.parent_id.toString());
    
    const response = await api.get(`/admin/categories?${queryParams}`);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: number) => {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  },

  // Create category
  createCategory: async (categoryData: {
    name: string;
    description?: string;
    parent_id?: number | null;
    icon?: string;
    color?: string;
    order_index?: number;
    is_active?: boolean;
  }) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id: number, categoryData: Partial<Category>) => {
    const response = await api.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: number) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Toggle category status
  toggleCategoryStatus: async (id: number) => {
    const response = await api.patch(`/admin/categories/${id}/toggle-status`);
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (): Promise<{ success: boolean; data: CategoryStats }> => {
    try {
      const response = await api.get('/admin/categories/stats');
      return response.data;
    } catch {
      // Return mock data if endpoint doesn't exist yet
      return {
        success: true,
        data: {
          total_categories: 0,
          active_categories: 0,
          parent_categories: 0,
          total_items: 0
        }
      };
    }
  },

  // Get categories for dropdown (simplified list)
  getCategoriesForDropdown: async () => {
    try {
      const response = await api.get('/admin/categories/dropdown');
      return response.data;
    } catch {
      // Fallback to regular categories endpoint
      const response = await api.get('/admin/categories');
      return {
        success: response.data.success,
        data: response.data.data.map((cat: Category) => ({
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id
        }))
      };
    }
  }
};