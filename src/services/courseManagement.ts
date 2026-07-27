import api from './api';

export interface AdminCourseListItem {
  uuid: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  educator?: {
    id: string;
    name: string;
    email: string;
    institution?: { id: number; name: string; pricing_mode: 'school' | 'private_educator' | 'coaching_center' } | null;
  } | null;
  testSeries?: { id: number; uuid: string; name: string; pricing_type: string; price: number; currency: string } | null;
}

export const courseManagementService = {
  getCourses: async (): Promise<{ success: boolean; data: AdminCourseListItem[] }> => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  setCoursePrice: async (uuid: string, price: number) => {
    const response = await api.put(`/admin/courses/${uuid}/price`, { price });
    return response.data;
  },
};
