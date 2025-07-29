import api from './api';

// ====================== INTERFACES ======================

export interface ExamCategory {
  id: number;
  name: string;
  name_gujarati: string;
  description?: string;
  description_gujarati?: string;
  hierarchy_level: number;
  parent_id?: number;
  hierarchy_path: string;
  display_order: number;
  icon_url?: string;
  color_code?: string;
  is_active: boolean;
  children?: ExamCategory[];
  parent?: ExamCategory;
}

export interface TestSeries {
  id: number;
  uuid: string;
  title: string;
  title_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  category_id: number;
  exam_type_id?: number;
  parent_series_id?: number;
  hierarchy_path?: string;
  price: string;
  original_price?: string;
  currency: string;
  is_free: boolean;
  free_test_count: number;
  total_tests: number;
  total_questions: number;
  estimated_duration?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  access_duration_days?: number;
  max_attempts_per_test?: number;
  supports_pause_resume: boolean;
  supports_multilanguage: boolean;
  has_negative_marking: boolean;
  negative_marks: string;
  instructions?: string;
  instructions_gujarati?: string;
  prerequisites?: string;
  learning_outcomes?: string;
  slug?: string;
  thumbnail_url?: string;
  tags?: any;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  total_enrollments: number;
  average_rating: string;
  total_reviews: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: ExamCategory;
  examType?: any;
  creator?: any;
  actualTestsCount: number;
  actualQuestionsCount: number;
  activeSubscribers: number;
}

export interface Test {
  id: number;
  uuid: string;
  test_series_id: number;
  title: string;
  title_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  test_type: 'practice' | 'mock' | 'previous_year' | 'sectional';
  duration_minutes: number;
  total_questions: number;
  max_marks: number;
  passing_marks: number;
  negative_marking: boolean;
  negative_marks_per_question: string;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  allow_question_review: boolean;
  allow_answer_change: boolean;
  instructions?: string;
  instructions_gujarati?: string;
  is_free: boolean;
  max_attempts?: number;
  available_from?: string;
  available_until?: string;
  display_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  testSeries?: TestSeries;
  creator?: any;
  actualQuestionsCount: number;
  totalAttempts: number;
  averageScore: number;
}

export interface Question {
  id: number;
  uuid: string;
  test_id: number;
  question: string;
  options: Array<{
    text: string;
    option: string;
    text_gujarati?: string;
  }>;
  correct_option: string;
  explanation?: string;
  question_gujarati?: string;
  options_gujarati?: any;
  explanation_gujarati?: string;
  subject?: string;
  topic?: string;
  sub_topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: string;
  image_url?: string;
  audio_url?: string;
  time_limit?: number;
  is_mandatory: boolean;
  display_order: number;
  is_active: boolean;
  total_attempts: number;
  correct_attempts: number;
  average_time: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  test?: Test;
  creator?: any;
}

// ====================== API SERVICES ======================

export class TestManagementService {
  
  // ==================== EXAM CATEGORIES ====================
  
  static async getExamCategories(params?: {
    level?: number;
    parent_id?: number;
    include_stats?: boolean;
  }) {
    const response = await api.get('/admin/exam-categories', { params });
    return response.data;
  }

  static async createExamCategory(data: Partial<ExamCategory>) {
    const response = await api.post('/admin/exam-categories', data);
    return response.data;
  }

  static async updateExamCategory(id: number, data: Partial<ExamCategory>) {
    const response = await api.put(`/admin/exam-categories/${id}`, data);
    return response.data;
  }

  static async deleteExamCategory(id: number) {
    const response = await api.delete(`/admin/exam-categories/${id}`);
    return response.data;
  }

  // ==================== TEST SERIES ====================
  
  static async getTestSeries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    exam_type_id?: number;
    is_published?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const response = await api.get('/admin/test-series-new', { params });
    return response.data;
  }

  static async getTestSeriesById(id: number) {
    const response = await api.get(`/admin/test-series-new/${id}`);
    return response.data;
  }

  static async createTestSeries(data: Partial<TestSeries>) {
    const response = await api.post('/admin/test-series-new', data);
    return response.data;
  }

  static async updateTestSeries(id: number, data: Partial<TestSeries>) {
    const response = await api.put(`/admin/test-series-new/${id}`, data);
    return response.data;
  }

  static async deleteTestSeries(id: number) {
    const response = await api.delete(`/admin/test-series-new/${id}`);
    return response.data;
  }

  static async togglePublishStatus(id: number) {
    const response = await api.patch(`/admin/test-series-new/${id}/publish`);
    return response.data;
  }

  static async getTestSeriesStats() {
    const response = await api.get('/admin/test-series/stats');
    return response.data;
  }

  // ==================== TESTS ====================
  
  static async getTestsForSeries(seriesId: number, params?: {
    page?: number;
    limit?: number;
    search?: string;
    test_type?: string;
    is_active?: boolean;
  }) {
    const response = await api.get(`/admin/test-series-new/${seriesId}/tests`, { params });
    return response.data;
  }

  static async createTest(seriesId: number, data: Partial<Test>) {
    const response = await api.post(`/admin/test-series-new/${seriesId}/tests`, data);
    return response.data;
  }

  static async updateTest(testId: number, data: Partial<Test>) {
    const response = await api.put(`/admin/tests-new/${testId}`, data);
    return response.data;
  }

  static async deleteTest(testId: number) {
    const response = await api.delete(`/admin/tests-new/${testId}`);
    return response.data;
  }

  // ==================== QUESTIONS ====================
  
  static async getQuestionsForTest(testId: number, params?: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    subject?: string;
  }) {
    const response = await api.get(`/admin/tests-new/${testId}/questions`, { params });
    return response.data;
  }

  static async createQuestion(testId: number, data: Partial<Question>) {
    const response = await api.post(`/admin/tests-new/${testId}/questions`, data);
    return response.data;
  }

  static async updateQuestion(questionId: number, data: Partial<Question>) {
    const response = await api.put(`/admin/questions-new/${questionId}`, data);
    return response.data;
  }

  static async deleteQuestion(questionId: number) {
    const response = await api.delete(`/admin/questions-new/${questionId}`);
    return response.data;
  }

  // ==================== ANALYTICS ====================
  
  static async getPerformanceAnalytics(params?: {
    dateRange?: string;
    category?: string;
    minScore?: number;
    maxScore?: number;
  }) {
    const response = await api.get('/admin/performance', { params });
    return response.data;
  }
}

export default TestManagementService;