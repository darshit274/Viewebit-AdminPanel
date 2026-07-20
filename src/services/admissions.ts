import api from './api';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'enrolled';

export interface Admission {
  uuid: string;
  username: string;
  email: string;
  phone?: string | null;
  application_status: ApplicationStatus;
  applied_at?: string | null;
  branch_id?: number | null;
  department_id?: number | null;
  branch?: { id: number; name: string };
  department?: { id: number; name: string };
  created_at: string;
}

export interface AdmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  enrolled: number;
  total: number;
}

export const admissionsService = {
  getAdmissions: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/admissions?${queryParams}`);
    return response.data;
  },

  getAdmissionStats: async (): Promise<{ success: boolean; data: AdmissionStats }> => {
    const response = await api.get('/admin/admissions/stats');
    return response.data;
  },

  updateAdmissionStatus: async (uuid: string, status: ApplicationStatus, branch_id?: number, department_id?: number) => {
    const response = await api.patch(`/admin/admissions/${uuid}/status`, { status, branch_id, department_id });
    return response.data;
  },
};
