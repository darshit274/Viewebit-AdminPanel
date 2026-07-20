import api from './api';

export interface Educator {
  id: string;
  name: string;
  email: string;
  designation?: string | null;
  employee_code?: string | null;
  bio?: string | null;
  isActive: boolean;
  institution_id?: number | null;
  branch_id?: number | null;
  department_id?: number | null;
  institution?: { id: number; name: string };
  branch?: { id: number; name: string };
  department?: { id: number; name: string };
  created_at: string;
}

export const educatorsService = {
  getEducators: async (params?: { search?: string; branch_id?: number; department_id?: number; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.branch_id) queryParams.append('branch_id', params.branch_id.toString());
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/educators?${queryParams}`);
    return response.data;
  },

  createEducator: async (data: {
    name: string;
    email: string;
    password: string;
    institution_id?: number;
    branch_id?: number;
    department_id?: number;
    designation?: string;
    employee_code?: string;
  }) => {
    const response = await api.post('/admin/educators', data);
    return response.data;
  },

  updateEducator: async (id: string, data: Partial<Educator>) => {
    const response = await api.put(`/admin/educators/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await api.patch(`/admin/educators/${id}/toggle-status`);
    return response.data;
  },
};
