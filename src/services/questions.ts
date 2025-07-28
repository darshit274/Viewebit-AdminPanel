import api from './api';

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  category_id?: number;
  exam_type_id?: number;
  marks: number;
  negative_marks?: number;
  explanation?: string;
  tags?: string[];
  is_active: boolean;
  image_url?: string;
  options: QuestionOption[];
  usage_count?: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
  examType?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface QuestionFilters {
  search?: string;
  category_id?: number;
  exam_type_id?: number;
  question_type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  is_active?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'question_text' | 'created_at' | 'difficulty_level' | 'usage_count' | 'marks';
  sortOrder?: 'ASC' | 'DESC';
}

export interface QuestionsResponse {
  success: boolean;
  data: Question[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuestionStats {
  total_questions: number;
  active_questions: number;
  questions_by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  questions_by_type: {
    single_choice: number;
    multiple_choice: number;
    true_false: number;
    fill_in_the_blank: number;
  };
  questions_by_category: Array<{
    category: string;
    count: number;
  }>;
  most_used_questions: Array<{
    id: number;
    question_text: string;
    usage_count: number;
  }>;
}

export const questionsService = {
  // Get all questions with filters
  getQuestions: async (filters: QuestionFilters = {}): Promise<QuestionsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters.question_type) params.append('question_type', filters.question_type);
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags[]', tag));
    }
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/admin/questions?${params.toString()}`);
    return response.data;
  },

  // Get question by ID
  getQuestionById: async (id: number): Promise<{ success: boolean; data: Question }> => {
    const response = await api.get(`/admin/questions/${id}`);
    return response.data;
  },

  // Create question
  createQuestion: async (data: {
    question_text: string;
    question_type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
    difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
    category_id?: number;
    exam_type_id?: number;
    marks: number;
    negative_marks?: number;
    explanation?: string;
    tags?: string[];
    is_active?: boolean;
    image_url?: string;
    options: Array<{
      option_text: string;
      is_correct: boolean;
      explanation?: string;
    }>;
  }): Promise<{ success: boolean; data: Question; message: string }> => {
    const response = await api.post('/admin/questions', data);
    return response.data;
  },

  // Update question
  updateQuestion: async (id: number, data: {
    question_text?: string;
    question_type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
    difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
    category_id?: number;
    exam_type_id?: number;
    marks?: number;
    negative_marks?: number;
    explanation?: string;
    tags?: string[];
    is_active?: boolean;
    image_url?: string;
    options?: Array<{
      id?: number;
      option_text: string;
      is_correct: boolean;
      explanation?: string;
    }>;
  }): Promise<{ success: boolean; data: Question; message: string }> => {
    const response = await api.put(`/admin/questions/${id}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/questions/${id}`);
    return response.data;
  },

  // Toggle question status
  toggleQuestionStatus: async (id: number): Promise<{ success: boolean; data: Question; message: string }> => {
    const response = await api.patch(`/admin/questions/${id}/toggle-status`);
    return response.data;
  },

  // Duplicate question
  duplicateQuestion: async (id: number): Promise<{ success: boolean; data: Question; message: string }> => {
    const response = await api.post(`/admin/questions/${id}/duplicate`);
    return response.data;
  },

  // Get question statistics
  getQuestionStats: async (): Promise<{ success: boolean; data: QuestionStats }> => {
    try {
      const response = await api.get('/admin/questions/stats');
      return response.data;
    } catch {
      // Return mock data if endpoint doesn't exist yet
      return {
        success: true,
        data: {
          total_questions: 0,
          active_questions: 0,
          questions_by_difficulty: {
            easy: 0,
            medium: 0,
            hard: 0
          },
          questions_by_type: {
            single_choice: 0,
            multiple_choice: 0,
            true_false: 0,
            fill_in_the_blank: 0
          },
          questions_by_category: [],
          most_used_questions: []
        }
      };
    }
  },

  // Get questions by test series
  getQuestionsByTestSeries: async (testSeriesId: string): Promise<{ success: boolean; data: Question[] }> => {
    const response = await api.get(`/admin/test-series/${testSeriesId}/questions`);
    return response.data;
  },

  // Search questions for test series
  searchQuestionsForTestSeries: async (filters: QuestionFilters & { exclude_test_series_id?: string }): Promise<QuestionsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters.question_type) params.append('question_type', filters.question_type);
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.exclude_test_series_id) params.append('exclude_test_series_id', filters.exclude_test_series_id);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/admin/questions/search?${params.toString()}`);
    return response.data;
  },

  // Upload question image
  uploadQuestionImage: async (file: File): Promise<{ success: boolean; data: { image_url: string }; message: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/admin/questions/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import questions from CSV/Excel
  importQuestions: async (file: File, options?: {
    category_id?: number;
    exam_type_id?: number;
    default_marks?: number;
  }): Promise<{ 
    success: boolean; 
    data: { 
      imported_count: number; 
      failed_count: number; 
      errors?: string[] 
    }; 
    message: string 
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.category_id) formData.append('category_id', options.category_id.toString());
    if (options?.exam_type_id) formData.append('exam_type_id', options.exam_type_id.toString());
    if (options?.default_marks) formData.append('default_marks', options.default_marks.toString());

    const response = await api.post('/admin/questions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export questions
  exportQuestions: async (filters?: QuestionFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters?.question_type) params.append('question_type', filters.question_type);
    if (filters?.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    params.append('format', format);

    const response = await api.get(`/admin/questions/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateQuestions: async (questionIds: number[], updateData: {
    is_active?: boolean;
    category_id?: number;
    exam_type_id?: number;
    difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
    marks?: number;
    tags?: string[];
  }): Promise<{ success: boolean; message: string; updated_count: number }> => {
    const response = await api.patch('/admin/questions/bulk-update', {
      question_ids: questionIds,
      ...updateData
    });
    return response.data;
  },

  // Bulk delete questions
  bulkDeleteQuestions: async (questionIds: number[]): Promise<{ success: boolean; message: string; deleted_count: number }> => {
    const response = await api.delete('/admin/questions/bulk-delete', {
      data: { question_ids: questionIds }
    });
    return response.data;
  },

  // Get available tags
  getAvailableTags: async (): Promise<{ success: boolean; data: string[] }> => {
    const response = await api.get('/admin/questions/tags');
    return response.data;
  }
};