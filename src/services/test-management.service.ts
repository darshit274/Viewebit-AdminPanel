/**
 * Test Management Service
 * 
 * Provides API services for all test management entities using proper
 * axios instance patterns and centralized endpoint configuration.
 * 
 * ✅ No hardcoded BASE_URL - uses axios instance baseURL
 * ✅ Centralized endpoint configuration
 * ✅ Proper TypeScript generics and type safety
 * ✅ Resource-based service architecture
 * ✅ Consistent CRUD patterns
 */

import { TEST_MANAGEMENT_ENDPOINTS } from '../lib/api/endpoints';
import { 
  createApiService, 
  createNestedApiService,
  TestSeriesBulkOperationParams,
  CategoryBulkOperationParams,
  SubCategoryBulkOperationParams,
  TestBulkOperationParams,
  QuestionBulkOperationParams
} from '../lib/api/base-service';
import type {
  TestSeries,
  TestSeriesFormData,
  Category,
  CategoryFormData,
  SubCategory,
  SubCategoryFormData,
  Test,
  TestFormData,
  Question,
  QuestionFormData,
} from '../types/test-management';

/**
 * Test Series Service - Root level resource
 */
const testSeriesService = createApiService<TestSeries, TestSeriesFormData, TestSeriesBulkOperationParams>({
  list: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BASE,
  byId: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BASE,
  bulk: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BULK,
});

/**
 * Categories Service - Nested under test series
 */
const categoriesService = createNestedApiService<Category, CategoryFormData, CategoryBulkOperationParams>({
  list: TEST_MANAGEMENT_ENDPOINTS.CATEGORIES.BY_TEST_SERIES,
  byId: TEST_MANAGEMENT_ENDPOINTS.CATEGORIES.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.CATEGORIES.BY_TEST_SERIES,
  bulk: TEST_MANAGEMENT_ENDPOINTS.CATEGORIES.BULK,
});

/**
 * Sub-categories Service - Nested under categories
 */
const subCategoriesService = createNestedApiService<SubCategory, SubCategoryFormData, SubCategoryBulkOperationParams>({
  list: TEST_MANAGEMENT_ENDPOINTS.SUB_CATEGORIES.BY_CATEGORY,
  byId: TEST_MANAGEMENT_ENDPOINTS.SUB_CATEGORIES.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.SUB_CATEGORIES.BY_CATEGORY,
  bulk: TEST_MANAGEMENT_ENDPOINTS.SUB_CATEGORIES.BULK,
});

/**
 * Tests Service - Nested under sub-categories
 */
const testsService = createNestedApiService<Test, TestFormData, TestBulkOperationParams>({
  list: TEST_MANAGEMENT_ENDPOINTS.TESTS.BY_SUB_CATEGORY,
  byId: TEST_MANAGEMENT_ENDPOINTS.TESTS.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.TESTS.BY_SUB_CATEGORY,
  bulk: TEST_MANAGEMENT_ENDPOINTS.TESTS.BULK,
});

/**
 * Questions Service - Nested under tests
 */
const questionsService = createNestedApiService<Question, QuestionFormData, QuestionBulkOperationParams>({
  list: TEST_MANAGEMENT_ENDPOINTS.QUESTIONS.BY_TEST,
  byId: TEST_MANAGEMENT_ENDPOINTS.QUESTIONS.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.QUESTIONS.BY_TEST,
  bulk: TEST_MANAGEMENT_ENDPOINTS.QUESTIONS.BULK,
});

/**
 * Unified Test Management Service Export
 * 
 * Provides a clean, organized API for all test management operations.
 * Each service follows consistent patterns and uses proper TypeScript typing.
 */
export const testManagementService = {
  testSeries: testSeriesService,
  categories: categoriesService,
  subCategories: subCategoriesService,
  tests: testsService,
  questions: questionsService,
} as const;

// Export individual services for direct access if needed
export {
  testSeriesService,
  categoriesService,
  subCategoriesService,
  testsService,
  questionsService,
};

/**
 * Service Usage Examples:
 * 
 * // List test series
 * const testSeries = await testManagementService.testSeries.list({ page: 1, limit: 10 });
 * 
 * // Create a new category under test series
 * const category = await testManagementService.categories.create(testSeriesUuid, categoryData);
 * 
 * // Update a test
 * const updatedTest = await testManagementService.tests.update(testUuid, testData);
 * 
 * // Bulk delete questions (using correct field name)
 * await testManagementService.questions.bulkOperations({
 *   action: 'delete',
 *   questionIds: selectedQuestionUuids
 * });
 * 
 * // Bulk activate categories (using correct field name)
 * await testManagementService.categories.bulkOperations({
 *   action: 'activate',
 *   categoryIds: selectedCategoryUuids
 * });
 */