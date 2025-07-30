import api from './api';

const API_URL = '/admin/new-hierarchy';

export interface TestSeries {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  display_order: number;
  icon_url?: string;
  color_code?: string;
  price: string;
  original_price?: string;
  currency: string;
  is_free: boolean;
  free_test_count: number;
  difficulty_level: string;
  access_duration_days?: number;
  max_attempts_per_test?: number;
  supports_pause_resume: boolean;
  supports_multilanguage: boolean;
  has_negative_marking: boolean;
  negative_marks?: string;
  instructions?: string;
  instructions_gujarati?: string;
  slug?: string;
  thumbnail_url?: string;
  tags?: any;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  total_categories: number;
  total_tests: number;
  total_questions: number;
  total_enrollments: number;
  average_rating: string;
  total_reviews: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface HierarchyCategory {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  test_series_id: number;
  parent_id?: number;
  hierarchy_level: number;
  hierarchy_path?: string;
  display_order: number;
  icon_url?: string;
  color_code?: string;
  slug?: string;
  tags?: any;
  metadata?: any;
  instructions?: string;
  instructions_gujarati?: string;
  is_active: boolean;
  is_featured: boolean;
  child_categories_count: number;
  tests_count: number;
  total_questions: number;
  total_attempts: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  parent?: HierarchyCategory;
  children?: HierarchyCategory[];
}

export interface NewTest {
  id: number;
  uuid: string;
  title: string;
  title_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  test_series_id: number;
  category_id: number;
  test_type: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  is_free: boolean;
  price: string;
  is_one_time: boolean;
  allows_pause: boolean;
  max_attempts?: number;
  has_negative_marking: boolean;
  negative_marks?: string;
  marks_per_question: number;
  available_from?: string;
  available_until?: string;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  supports_multilanguage: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;
  instructions?: string;
  instructions_gujarati?: string;
  slug?: string;
  thumbnail_url?: string;
  tags?: any;
  metadata?: any;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  display_order: number;
  total_attempts: number;
  total_completions: number;
  average_score: string;
  average_time_taken: number;
  highest_score: string;
  lowest_score: string;
  pass_rate: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: HierarchyCategory;
  testSeries?: TestSeries;
}

export interface NewQuestion {
  id: number;
  uuid: string;
  test_id: number;
  test_series_id: number;
  category_id: number;
  question_text: string;
  question_text_gujarati?: string;
  question_image_url?: string;
  question_type: string;
  difficulty_level: string;
  marks: number;
  negative_marks?: string;
  options: any[];
  correct_answer: string[];
  explanation?: string;
  explanation_gujarati?: string;
  explanation_image_url?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  tags?: any;
  estimated_time_seconds: number;
  is_active: boolean;
  display_order: number;
  source?: string;
  reference_url?: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: string;
  average_time_taken: number;
  created_by?: string;
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
  test?: NewTest;
}

export interface HierarchyStats {
  categories: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    total: number;
  };
  tests: number;
  questions: number;
}

const newHierarchyService = {
  // Test Series Management
  getAllTestSeries: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await api.get(`${API_URL}/test-series`, { params });
    return response.data;
  },

  getTestSeries: async (id: string | number) => {
    const response = await api.get(`${API_URL}/test-series/${id}`);
    return response.data;
  },

  createTestSeries: async (data: Partial<TestSeries>) => {
    const response = await api.post(`${API_URL}/test-series`, data);
    return response.data;
  },

  updateTestSeries: async (id: string | number, data: Partial<TestSeries>) => {
    const response = await api.put(`${API_URL}/test-series/${id}`, data);
    return response.data;
  },

  deleteTestSeries: async (id: string | number) => {
    const response = await api.delete(`${API_URL}/test-series/${id}`);
    return response.data;
  },

  // Hierarchy Categories Management
  getCategories: async (testSeriesId: number, params?: { level?: number; parentId?: number; includeChildren?: boolean }) => {
    const response = await api.get(`${API_URL}/test-series/${testSeriesId}/categories`, { params });
    return response.data;
  },

  getFullHierarchy: async (testSeriesId: number) => {
    const response = await api.get(`${API_URL}/test-series/${testSeriesId}/hierarchy`);
    return response.data;
  },

  createCategory: async (testSeriesId: number, data: Partial<HierarchyCategory>) => {
    const response = await api.post(`${API_URL}/test-series/${testSeriesId}/categories`, data);
    return response.data;
  },

  updateCategory: async (id: string | number, data: Partial<HierarchyCategory>) => {
    const response = await api.put(`${API_URL}/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string | number) => {
    const response = await api.delete(`${API_URL}/categories/${id}`);
    return response.data;
  },

  getHierarchyStats: async (testSeriesId: number) => {
    const response = await api.get(`${API_URL}/test-series/${testSeriesId}/stats`);
    return response.data;
  },

  // Tests Management
  getTestsByCategory: async (categoryId: number, params?: { page?: number; limit?: number; type?: string; status?: string }) => {
    const response = await api.get(`${API_URL}/categories/${categoryId}/tests`, { params });
    return response.data;
  },

  getTest: async (id: string | number) => {
    const response = await api.get(`${API_URL}/tests/${id}`);
    return response.data;
  },

  createTest: async (categoryId: number, data: Partial<NewTest>) => {
    const response = await api.post(`${API_URL}/categories/${categoryId}/tests`, data);
    return response.data;
  },

  updateTest: async (id: string | number, data: Partial<NewTest>) => {
    const response = await api.put(`${API_URL}/tests/${id}`, data);
    return response.data;
  },

  deleteTest: async (id: string | number) => {
    const response = await api.delete(`${API_URL}/tests/${id}`);
    return response.data;
  },

  // Questions Management
  getQuestionsByTest: async (testId: number, params?: { page?: number; limit?: number; type?: string; difficulty?: string }) => {
    const response = await api.get(`${API_URL}/tests/${testId}/questions`, { params });
    return response.data;
  },

  getQuestion: async (id: string | number) => {
    const response = await api.get(`${API_URL}/questions/${id}`);
    return response.data;
  },

  createQuestion: async (testId: number, data: Partial<NewQuestion>) => {
    const response = await api.post(`${API_URL}/tests/${testId}/questions`, data);
    return response.data;
  },

  updateQuestion: async (id: string | number, data: Partial<NewQuestion>) => {
    const response = await api.put(`${API_URL}/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id: string | number) => {
    const response = await api.delete(`${API_URL}/questions/${id}`);
    return response.data;
  },
};

export default newHierarchyService;