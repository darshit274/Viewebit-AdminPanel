import api from './api';
import { PaginationParams } from '../types';

export interface StudentFilters extends PaginationParams {
  is_active?: boolean;
  is_verified?: boolean;
  is_premium?: boolean;
}

export interface StudentStats {
  total_students: number;
  active_students: number;
  verified_students: number;
  premium_students: number;
  new_students_this_week: number;
  unverified_students: number;
  total_test_attempts: number;
  average_performance: number;
}

export const studentsService = {
  // Get all students with pagination and filters
  getStudents: async (params: StudentFilters) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.is_active !== undefined && { is_active: params.is_active.toString() }),
      ...(params.is_verified !== undefined && { is_verified: params.is_verified.toString() }),
      ...(params.is_premium !== undefined && { is_premium: params.is_premium.toString() })
    });
    
    // Updated to use /admin/users endpoint to match backend
    const response = await api.get(`/admin/users?${queryParams}`);
    
    return {
      data: response.data // This contains the backend response: { success, data, pagination }
    };
  },

  // Get single student by ID
  getStudentById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return { data: response.data };
  },

  // Create new student
  createStudent: async (data: { 
    username: string; 
    email: string; 
    password: string; 
    phone?: string;
  }) => {
    const response = await api.post('/admin/users', data);
    return { data: response.data };
  },

  // Update student
  updateStudent: async (id: string, data: { 
    username?: string; 
    email?: string; 
    phone?: string; 
    isEmailVerified?: boolean;
  }) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return { data: response.data };
  },

  // Delete student
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return { data: response.data };
  },

  // Toggle student status (active/inactive)
  toggleStudentStatus: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/toggle-status`);
    return { data: response.data };
  },

  // Verify student account
  verifyStudent: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/verify`);
    return { data: response.data };
  },

  // Grant/revoke premium access
  togglePremiumStatus: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/toggle-premium`);
    return { data: response.data };
  },

  // Get student statistics
  getStudentStats: async (): Promise<{ success: boolean; data: StudentStats }> => {
    try {
      const response = await api.get('/admin/users/stats');
      return response.data;
    } catch {
      // Return mock data if endpoint doesn't exist yet
      return {
        success: true,
        data: {
          total_students: 0,
          active_students: 0,
          verified_students: 0,
          premium_students: 0,
          new_students_this_week: 0,
          unverified_students: 0,
          total_test_attempts: 0,
          average_performance: 0
        }
      };
    }
  },

  // Get student test attempts
  getStudentTestAttempts: async (id: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/users/${id}/test-attempts?${queryParams}`);
    return { data: response.data };
  },

  // Send reset password email
  sendPasswordReset: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return { data: response.data };
  },

  // Export students data
  exportStudents: async (filters?: StudentFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
    if (filters?.is_premium !== undefined) params.append('is_premium', filters.is_premium.toString());

    const response = await api.get(`/admin/users/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};