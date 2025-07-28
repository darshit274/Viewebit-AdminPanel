import api from './api';

export interface TestSeries {
  id: string;
  title: string;
  description?: string;
  exam_type_id: number;
  category_id?: number;
  total_questions: number;
  duration_minutes: number;
  max_attempts: number;
  pass_percentage: number;
  negative_marking: boolean;
  negative_marks_per_question?: number;
  is_active: boolean;
  is_premium: boolean;
  is_public: boolean;
  instructions?: string;
  tags?: string[];
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  scheduled_at?: string;
  expires_at?: string;
  total_attempts: number;
  average_score: number;
  created_at: string;
  updated_at: string;
  examType?: {
    id: number;
    name: string;
    code: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface TestSeriesFilters {
  search?: string;
  exam_type_id?: number;
  category_id?: number;
  is_active?: boolean;
  is_premium?: boolean;
  is_public?: boolean;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'created_at' | 'total_attempts' | 'average_score' | 'difficulty_level';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TestSeriesResponse {
  success: boolean;
  data: TestSeries[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TestSeriesStats {
  total_test_series: number;
  active_test_series: number;
  premium_test_series: number;
  total_attempts: number;
  average_completion_rate: number;
  popular_categories: Array<{
    category: string;
    count: number;
  }>;
}

export const testSeriesService = {
  // Get all test series with filters
  getTestSeries: async (filters: TestSeriesFilters = {}): Promise<TestSeriesResponse> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.is_premium !== undefined) params.append('is_premium', filters.is_premium.toString());
    if (filters.is_public !== undefined) params.append('is_public', filters.is_public.toString());
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/admin/test-series?${params.toString()}`);
    return response.data;
  },

  // Get test series by ID
  getTestSeriesById: async (id: string): Promise<{ success: boolean; data: TestSeries }> => {
    const response = await api.get(`/admin/test-series/${id}`);
    return response.data;
  },

  // Create test series
  createTestSeries: async (data: {
    title: string;
    description?: string;
    exam_type_id: number;
    category_id?: number;
    total_questions: number;
    duration_minutes: number;
    max_attempts?: number;
    pass_percentage?: number;
    negative_marking?: boolean;
    negative_marks_per_question?: number;
    is_active?: boolean;
    is_premium?: boolean;
    is_public?: boolean;
    instructions?: string;
    tags?: string[];
    difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
    scheduled_at?: string;
    expires_at?: string;
  }): Promise<{ success: boolean; data: TestSeries; message: string }> => {
    const response = await api.post('/admin/test-series', data);
    return response.data;
  },

  // Update test series
  updateTestSeries: async (id: string, data: Partial<TestSeries>): Promise<{ success: boolean; data: TestSeries; message: string }> => {
    const response = await api.put(`/admin/test-series/${id}`, data);
    return response.data;
  },

  // Delete test series
  deleteTestSeries: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/test-series/${id}`);
    return response.data;
  },

  // Toggle test series status
  toggleTestSeriesStatus: async (id: string): Promise<{ success: boolean; data: TestSeries; message: string }> => {
    const response = await api.patch(`/admin/test-series/${id}/toggle-status`);
    return response.data;
  },

  // Duplicate test series
  duplicateTestSeries: async (id: string, data?: { title?: string }): Promise<{ success: boolean; data: TestSeries; message: string }> => {
    const response = await api.post(`/admin/test-series/${id}/duplicate`, data);
    return response.data;
  },

  // Get test series statistics
  getTestSeriesStats: async (): Promise<{ success: boolean; data: TestSeriesStats }> => {
    try {
      const response = await api.get('/admin/test-series/stats');
      return response.data;
    } catch {
      // Return mock data if endpoint doesn't exist yet
      return {
        success: true,
        data: {
          total_test_series: 0,
          active_test_series: 0,
          premium_test_series: 0,
          total_attempts: 0,
          average_completion_rate: 0,
          popular_categories: []
        }
      };
    }
  },

  // Get test series attempts
  getTestSeriesAttempts: async (id: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      user_id: number;
      user_name: string;
      user_email: string;
      score: number;
      percentage: number;
      total_questions: number;
      correct_answers: number;
      wrong_answers: number;
      skipped_answers: number;
      time_taken: number;
      completed_at: string;
    }>;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/admin/test-series/${id}/attempts?${queryParams}`);
    return response.data;
  },

  // Get test series questions
  getTestSeriesQuestions: async (id: string): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      question_text: string;
      question_type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
      difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
      marks: number;
      options: Array<{
        id: number;
        option_text: string;
        is_correct: boolean;
      }>;
      explanation?: string;
      order_index: number;
    }>;
  }> => {
    const response = await api.get(`/admin/test-series/${id}/questions`);
    return response.data;
  },

  // Update test series questions order
  updateQuestionsOrder: async (id: string, questionIds: number[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/admin/test-series/${id}/questions/reorder`, {
      question_ids: questionIds
    });
    return response.data;
  },

  // Add questions to test series
  addQuestionsToTestSeries: async (id: string, questionIds: number[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/test-series/${id}/questions`, {
      question_ids: questionIds
    });
    return response.data;
  },

  // Remove questions from test series
  removeQuestionsFromTestSeries: async (id: string, questionIds: number[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/test-series/${id}/questions`, {
      data: { question_ids: questionIds }
    });
    return response.data;
  },

  // Get test series for dropdown
  getTestSeriesForDropdown: async (examTypeId?: number): Promise<{ 
    success: boolean; 
    data: Array<{ id: string; title: string; exam_type_id: number }> 
  }> => {
    const params = examTypeId ? `?exam_type_id=${examTypeId}` : '';
    const response = await api.get(`/admin/test-series/dropdown${params}`);
    return response.data;
  },

  // Export test series data
  exportTestSeries: async (filters?: TestSeriesFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await api.get(`/admin/test-series/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateTestSeries: async (testSeriesIds: string[], updateData: {
    is_active?: boolean;
    is_premium?: boolean;
    is_public?: boolean;
    category_id?: number;
  }): Promise<{ success: boolean; message: string; updated_count: number }> => {
    const response = await api.patch('/admin/test-series/bulk-update', {
      test_series_ids: testSeriesIds,
      ...updateData
    });
    return response.data;
  }
};