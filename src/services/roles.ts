import api from './api';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'institution_admin' | 'branch_admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: Record<string, boolean> | null;
  isActive: boolean;
  institution_id?: number | null;
  branch_id?: number | null;
  department_id?: number | null;
  branch?: { id: number; name: string };
  department?: { id: number; name: string };
  created_at: string;
}

export const PERMISSION_KEYS = [
  { key: 'manage_branches', label: 'Manage Branches & Departments' },
  { key: 'manage_admissions', label: 'Manage Admissions & Enrollments' },
  { key: 'manage_revenue', label: 'View & Edit Revenue' },
  { key: 'manage_educators', label: 'Manage Educator Accounts' },
  { key: 'manage_content', label: 'Manage Courses & Content' },
];

export const rolesService = {
  getAdmins: async (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/roles?${queryParams}`);
    return response.data;
  },

  getAvailableRoles: async () => {
    const response = await api.get('/admin/roles/available');
    return response.data;
  },

  updateAdminRole: async (
    id: string,
    data: { role?: AdminRole; permissions?: Record<string, boolean>; branch_id?: number | null; department_id?: number | null }
  ) => {
    const response = await api.patch(`/admin/roles/${id}`, data);
    return response.data;
  },
};
