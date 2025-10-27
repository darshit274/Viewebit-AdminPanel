/**
 * Test Management Types
 * 
 * Comprehensive TypeScript interfaces for the test management system.
 * Properly aligned with the new API service architecture.
 */

import type { 
  ApiListResponse, 
  PaginationParams, 
  BulkOperationParams, 
  BulkOperationResponse,
  TestSeriesBulkOperationParams,
  CategoryBulkOperationParams,
  SubCategoryBulkOperationParams,
  TestBulkOperationParams,
  QuestionBulkOperationParams
} from '../lib/api/base-service';

// Re-export common types from base service
export type { 
  PaginationParams, 
  BulkOperationParams, 
  BulkOperationResponse,
  TestSeriesBulkOperationParams,
  CategoryBulkOperationParams,
  SubCategoryBulkOperationParams,
  TestBulkOperationParams,
  QuestionBulkOperationParams
};

// Re-export utility helpers
// BulkOperationHelpers is imported directly from base-service where needed

// Common entity base interface
export interface BaseEntity {
  id: number;
  uuid: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Common translatable fields interface
export interface TranslatableFields {
  name_gujarati?: string;
  description_gujarati?: string;
  title_gujarati?: string;
  description_gujarati?: string;
}

// Test Series Entity & Form Data
export interface TestSeries extends BaseEntity {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  categories_count: number;
  pricing_type: 'free' | 'paid' | 'previous_years_question_papers';
  price: number;
  currency: string;
  features?: any;
  discount_percentage: number;
  is_featured: boolean;
}

export interface TestSeriesFormData {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  is_active?: boolean;
  pricing_type?: 'free' | 'paid' | 'previous_years_question_papers';
  price?: number;
  currency?: string;
  features?: any;
  discount_percentage?: number;
  is_featured?: boolean;
}

// Category Entity & Form Data
export interface Category extends BaseEntity {
  name: string;
  description: string;
  name_gujarati?: string;
  description_gujarati?: string;
  test_series_id: number;
  subCategories_count: number;
}

export interface CategoryFormData {
  name: string;
  description: string;
  name_gujarati?: string;
  description_gujarati?: string;
  is_active?: boolean;
}

// Sub-category Entity & Form Data
export interface SubCategory extends BaseEntity {
  name: string;
  description: string;
  name_gujarati?: string;
  description_gujarati?: string;
  category_id: number;
  tests_count: number;
}

export interface SubCategoryFormData {
  name: string;
  description: string;
  name_gujarati?: string;
  description_gujarati?: string;
  is_active?: boolean;
}

// Test Entity & Form Data
export interface Test extends BaseEntity {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  duration_minutes: number;
  total_marks: number;
  sub_category_id: number;
  questions_count: number;
  is_demo: boolean;
  is_free_in_paid_series: boolean;
  negative_marking_enabled: boolean;
  negative_marks_per_wrong: number;
  is_one_time_only: boolean;
  max_duration_minutes?: number;
  attempt_restrictions?: any;
  passing_marks?: number;
  instructions?: string;
  instructions_gujarati?: string;
}

export interface TestFormData {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  duration_minutes: number;
  total_marks: number;
  is_active?: boolean;
  is_demo?: boolean;
  is_free_in_paid_series?: boolean;
  negative_marking_enabled?: boolean;
  negative_marks_per_wrong?: number;
  is_one_time_only?: boolean;
  max_duration_minutes?: number;
  attempt_restrictions?: any;
  passing_marks?: number;
  instructions?: string;
  instructions_gujarati?: string;
}

// Question Entity & Form Data
export interface Question extends BaseEntity {
  question_text: string;
  question_text_gujarati?: string;
  option_a: string;
  option_a_gujarati?: string;
  option_b: string;
  option_b_gujarati?: string;
  option_c: string;
  option_c_gujarati?: string;
  option_d: string;
  option_d_gujarati?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  marks: number;
  test_id: number;
}

export interface QuestionFormData {
  question_text: string;
  question_text_gujarati?: string;
  option_a: string;
  option_a_gujarati?: string;
  option_b: string;
  option_b_gujarati?: string;
  option_c: string;
  option_c_gujarati?: string;
  option_d: string;
  option_d_gujarati?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  marks: number;
  is_active?: boolean;
}

// Specialized list response types that extend the base ApiListResponse
export interface TestSeriesListResponse extends ApiListResponse<TestSeries> {
  stats: {
    total: number;
    active: number;
    inactive: number;
    withCategories: number;
  };
}

export interface CategoryListResponse extends ApiListResponse<Category> {
  data: {
    testSeries: TestSeries;
    categories: Category[];
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    withSubCategories: number;
  };
}

export interface SubCategoryListResponse extends ApiListResponse<SubCategory> {
  data: {
    category: Category;
    subCategories: SubCategory[];
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    withTests: number;
  };
}

export interface TestListResponse extends ApiListResponse<Test> {
  data: {
    subCategory: SubCategory;
    tests: Test[];
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    withQuestions: number;
  };
}

export interface QuestionListResponse extends ApiListResponse<Question> {
  data: {
    test: Test;
    questions: Question[];
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalMarks: number;
  };
}

// Utility types for form validation and state management
export type EntityType = 'testSeries' | 'category' | 'subCategory' | 'test' | 'question';

export type FormDataMap = {
  testSeries: TestSeriesFormData;
  category: CategoryFormData;
  subCategory: SubCategoryFormData;
  test: TestFormData;
  question: QuestionFormData;
};

export type EntityMap = {
  testSeries: TestSeries;
  category: Category;
  subCategory: SubCategory;
  test: Test;
  question: Question;
};

// Status filter options
export type StatusFilter = 'all' | 'active' | 'inactive';

// Sort order options
export type SortOrder = 'ASC' | 'DESC';

// Bulk action types
export type BulkAction = 'activate' | 'deactivate' | 'delete';

// Common statistics interface
export interface EntityStats {
  total: number;
  active: number;
  inactive: number;
  [key: string]: number;
}