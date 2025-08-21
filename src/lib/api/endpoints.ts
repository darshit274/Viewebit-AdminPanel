/**
 * API Endpoints Configuration
 * 
 * Centralized endpoint definitions following REST conventions.
 * All endpoints are relative to the base URL configured in the axios instance.
 */

// API Version
export const API_VERSION = 'v1';

// Base paths for different modules
export const BASE_PATHS = {
  ADMIN: '/admin',
  AUTH: '/auth',
  UPLOADS: '/uploads',
} as const;

// Test Management Endpoints
export const TEST_MANAGEMENT_ENDPOINTS = {
  // Test Series
  TEST_SERIES: {
    BASE: `${BASE_PATHS.ADMIN}/test-management`,
    BY_ID: (uuid: string) => `${BASE_PATHS.ADMIN}/test-management/${uuid}`,
    BULK: `${BASE_PATHS.ADMIN}/test-management/bulk`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: `${BASE_PATHS.ADMIN}/test-management/categories`,
    BY_ID: (uuid: string) => `${BASE_PATHS.ADMIN}/test-management/categories/${uuid}`,
    BY_TEST_SERIES: (testSeriesUuid: string) => `${BASE_PATHS.ADMIN}/test-management/test-series/${testSeriesUuid}/categories`,
    BULK: `${BASE_PATHS.ADMIN}/test-management/categories/bulk`,
  },
  
  // Sub-categories
  SUB_CATEGORIES: {
    BASE: `${BASE_PATHS.ADMIN}/test-management/sub-categories`,
    BY_ID: (uuid: string) => `${BASE_PATHS.ADMIN}/test-management/sub-categories/${uuid}`,
    BY_CATEGORY: (categoryUuid: string) => `${BASE_PATHS.ADMIN}/test-management/categories/${categoryUuid}/sub-categories`,
    BULK: `${BASE_PATHS.ADMIN}/test-management/sub-categories/bulk`,
  },
  
  // Tests
  TESTS: {
    BASE: `${BASE_PATHS.ADMIN}/test-management/tests`,
    BY_ID: (uuid: string) => `${BASE_PATHS.ADMIN}/test-management/tests/${uuid}`,
    BY_SUB_CATEGORY: (subCategoryUuid: string) => `${BASE_PATHS.ADMIN}/test-management/sub-categories/${subCategoryUuid}/tests`,
    BULK: `${BASE_PATHS.ADMIN}/test-management/tests/bulk`,
  },
  
  // Questions
  QUESTIONS: {
    BASE: `${BASE_PATHS.ADMIN}/test-management/questions`,
    BY_ID: (uuid: string) => `${BASE_PATHS.ADMIN}/test-management/questions/${uuid}`,
    BY_TEST: (testUuid: string) => `${BASE_PATHS.ADMIN}/test-management/tests/${testUuid}/questions`,
    BULK: `${BASE_PATHS.ADMIN}/test-management/questions/bulk`,
  },
} as const;

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_PATHS.AUTH}/login`,
  LOGOUT: `${BASE_PATHS.AUTH}/logout`,
  REFRESH: `${BASE_PATHS.AUTH}/refresh`,
  ME: `${BASE_PATHS.AUTH}/me`,
} as const;

// File Upload Endpoints
export const UPLOAD_ENDPOINTS = {
  IMAGES: `${BASE_PATHS.UPLOADS}/images`,
  PDFS: `${BASE_PATHS.UPLOADS}/pdfs`,
  BULK: `${BASE_PATHS.UPLOADS}/bulk`,
} as const;

// Utility function to build endpoint with query parameters
export function buildEndpoint(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}