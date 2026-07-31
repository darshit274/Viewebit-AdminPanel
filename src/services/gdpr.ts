import api from './api';

export type GdprSubjectType = 'student' | 'educator';

export interface GdprSubjectSummary {
  subjectType: GdprSubjectType;
  uuid: string;
  name: string;
  email: string;
  institution_id: number | null;
  is_anonymized: boolean;
}

export interface DataSubjectRequestRecord {
  id: number;
  subject_type: GdprSubjectType;
  subject_uuid: string;
  request_type: 'export' | 'anonymize';
  performed_by_admin_id: string;
  institution_id: number | null;
  reason: string | null;
  created_at: string;
}

export const gdprService = {
  search: async (query: string, subjectType: GdprSubjectType): Promise<{ success: boolean; data: GdprSubjectSummary }> => {
    const response = await api.get('/admin/gdpr/search', { params: { query, subjectType } });
    return response.data;
  },

  exportSubject: async (subjectType: GdprSubjectType, uuid: string): Promise<Blob> => {
    try {
      const response = await api.get(`/admin/gdpr/${subjectType}/${uuid}/export`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      // With responseType: 'blob', axios delivers even a JSON error body as an
      // opaque Blob — parse it back to JSON so callers can read
      // error.response.data.message like they do for every other request.
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          error.response.data = JSON.parse(text);
        } catch {
          // Not JSON — leave error.response.data as the raw Blob.
        }
      }
      throw error;
    }
  },

  anonymizeSubject: async (subjectType: GdprSubjectType, uuid: string, reason: string) => {
    const response = await api.post(`/admin/gdpr/${subjectType}/${uuid}/anonymize`, { reason });
    return response.data;
  },

  listRequests: async (
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data: DataSubjectRequestRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await api.get('/admin/gdpr/requests', { params: { page, limit } });
    return response.data;
  },
};
