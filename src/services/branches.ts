import api from './api';

export interface Institution {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  contact_email?: string | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  uuid: string;
  branch_id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Branch {
  id: number;
  uuid: string;
  institution_id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  is_active: boolean;
  display_order: number;
  institution?: Institution;
  departments?: Department[];
}

export const institutionsService = {
  getInstitutionsForDropdown: async (): Promise<{ success: boolean; data: Institution[] }> => {
    const response = await api.get('/admin/institutions/dropdown');
    return response.data;
  },
};

export const branchesService = {
  getBranchesForDropdown: async (): Promise<{ success: boolean; data: Branch[] }> => {
    const response = await api.get('/admin/branches/dropdown');
    return response.data;
  },

  getBranches: async (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/branches?${queryParams}`);
    return response.data;
  },

  getBranchById: async (uuid: string) => {
    const response = await api.get(`/admin/branches/${uuid}`);
    return response.data;
  },

  createBranch: async (data: {
    institution_id: number;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
  }) => {
    const response = await api.post('/admin/branches', data);
    return response.data;
  },

  updateBranch: async (uuid: string, data: Partial<Branch>) => {
    const response = await api.put(`/admin/branches/${uuid}`, data);
    return response.data;
  },

  deleteBranch: async (uuid: string) => {
    const response = await api.delete(`/admin/branches/${uuid}`);
    return response.data;
  },

  toggleBranchStatus: async (uuid: string) => {
    const response = await api.patch(`/admin/branches/${uuid}/toggle-status`);
    return response.data;
  },
};

export const departmentsService = {
  getDepartmentsForDropdown: async (branchId: number): Promise<{ success: boolean; data: Department[] }> => {
    const response = await api.get(`/admin/departments/dropdown?branch_id=${branchId}`);
    return response.data;
  },

  getDepartments: async (branchId: number) => {
    const response = await api.get(`/admin/departments?branch_id=${branchId}`);
    return response.data;
  },

  createDepartment: async (data: { branch_id: number; name: string; code?: string }) => {
    const response = await api.post('/admin/departments', data);
    return response.data;
  },

  updateDepartment: async (uuid: string, data: Partial<Department>) => {
    const response = await api.put(`/admin/departments/${uuid}`, data);
    return response.data;
  },

  deleteDepartment: async (uuid: string) => {
    const response = await api.delete(`/admin/departments/${uuid}`);
    return response.data;
  },

  toggleDepartmentStatus: async (uuid: string) => {
    const response = await api.patch(`/admin/departments/${uuid}/toggle-status`);
    return response.data;
  },
};
