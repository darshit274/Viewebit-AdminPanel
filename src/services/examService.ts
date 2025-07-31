import api from './api';

export interface ExamType {
  id: number;
  name: string;
  code: string;
  description?: string;
  name_gujarati?: string;
  description_gujarati?: string;
  is_active: boolean;
  testSeriesCount?: number;
  pyqCount?: number;
  created_at: string;
  updated_at: string;
}

export interface ExamFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'code' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExamResponse {
  success: boolean;
  data: ExamType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TestSeriesByExam {
  id: string;
  title: string;
  description?: string;
  exam_type_id: number;
  total_questions: number;
  duration_minutes: number;
  max_attempts: number;
  pass_percentage: number;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  examType?: ExamType;
}

class ExamService {
  // Get all exam types with filters
  async getExamTypes(filters: ExamFilters = {}): Promise<ExamResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/admin/exam-types?${params.toString()}`);
    return response.data;
  }

  // Get single exam type by ID
  async getExamTypeById(id: number): Promise<{ success: boolean; data: ExamType }> {
    const response = await api.get(`/admin/exam-types/${id}`);
    return response.data;
  }

  // Create exam type
  async createExamType(data: {
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: ExamType; message: string }> {
    const response = await api.post('/admin/exam-types', data);
    return response.data;
  }

  // Update exam type
  async updateExamType(id: number, data: Partial<ExamType>): Promise<{ success: boolean; data: ExamType; message: string }> {
    const response = await api.put(`/admin/exam-types/${id}`, data);
    return response.data;
  }

  // Delete exam type
  async deleteExamType(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/exam-types/${id}`);
    return response.data;
  }

  // Get exam types for dropdown
  async getExamTypesForDropdown(): Promise<{ success: boolean; data: Array<{ id: number; name: string; code: string }> }> {
    const response = await api.get('/admin/exam-types/dropdown');
    return response.data;
  }

  // Get test series by exam type
  async getTestSeriesByExam(examTypeId: number): Promise<{ success: boolean; data: TestSeriesByExam[] }> {
    const response = await api.get(`/admin/test-series?exam_type_id=${examTypeId}`);
    return response.data;
  }

  // Get exam statistics
  async getExamStats(examTypeId?: number): Promise<{ 
    success: boolean; 
    data: {
      totalExamTypes: number;
      totalTestSeries: number;
      totalPYQs: number;
      activeExams: number;
      recentActivity: Array<{
        type: 'exam_created' | 'test_series_created' | 'pyq_added';
        title: string;
        date: string;
        examType?: string;
      }>;
    }
  }> {
    const params = examTypeId ? `?exam_type_id=${examTypeId}` : '';
    const response = await api.get(`/admin/exam-types/stats${params}`);
    return response.data;
  }
}

export const examService = new ExamService();
export default examService;