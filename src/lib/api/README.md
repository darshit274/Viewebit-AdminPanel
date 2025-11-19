# API Service Architecture Documentation

## Overview

This document describes the improved API service architecture that eliminates the previous issues with hardcoded BASE_URLs and provides a consistent, type-safe, and maintainable approach to API communication.

## ✅ Key Improvements

### 1. **Proper Axios Instance Usage**
- ❌ **Before**: `api.get(\`${BASE_URL}/endpoint\`)`
- ✅ **After**: `api.get('/admin/test-management')`
- The axios instance handles the base URL configuration

### 2. **Centralized Endpoint Management**
- All endpoints defined in `endpoints.ts`
- Environment-specific configuration
- Consistent URL patterns

### 3. **Resource-Based Service Architecture**
- Base service classes for common patterns
- Specialized services for nested resources
- Type-safe service factories

### 4. **Enhanced Type Safety**
- Full TypeScript coverage
- Generic service types
- Proper response/request typing

## Architecture Components

### 1. API Client (`client.ts`)

```typescript
// Axios instance with proper configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5004/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Typed API methods
export const api = {
  get: <T>(url: string): Promise<T> => request<T>('GET', url),
  post: <T>(url: string, data?: any): Promise<T> => request<T>('POST', url, data),
  // ... other methods
};
```

### 2. Endpoint Configuration (`endpoints.ts`)

```typescript
export const TEST_MANAGEMENT_ENDPOINTS = {
  TEST_SERIES: {
    BASE: '/admin/test-management',
    BY_ID: (uuid: string) => `/admin/test-management/${uuid}`,
    BULK: '/admin/test-management/bulk',
  },
  // ... other endpoints
} as const;
```

### 3. Base Service Classes (`base-service.ts`)

```typescript
// For root-level resources
export abstract class BaseApiService<TEntity, TFormData> {
  protected abstract endpoints: {
    list: string;
    byId: (uuid: string) => string;
    create: string;
    bulk: string;
  };

  async list(params?: PaginationParams): Promise<ApiListResponse<TEntity>> {
    const endpoint = buildEndpoint(this.endpoints.list, params);
    return api.get<ApiListResponse<TEntity>>(endpoint);
  }
  // ... other CRUD methods
}

// For nested resources
export abstract class NestedApiService<TEntity, TFormData> {
  async list(parentUuid: string, params?: PaginationParams): Promise<ApiListResponse<TEntity>> {
    const endpoint = buildEndpoint(this.endpoints.list(parentUuid), params);
    return api.get<ApiListResponse<TEntity>>(endpoint);
  }
  // ... other methods
}
```

### 4. Service Implementation (`test-management.service.ts`)

```typescript
// Clean, declarative service creation
const testSeriesService = createApiService<TestSeries, TestSeriesFormData>({
  list: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BASE,
  byId: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BY_ID,
  create: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BASE,
  bulk: TEST_MANAGEMENT_ENDPOINTS.TEST_SERIES.BULK,
});

export const testManagementService = {
  testSeries: testSeriesService,
  categories: categoriesService,
  subCategories: subCategoriesService,
  tests: testsService,
  questions: questionsService,
} as const;
```

## Usage Examples

### Basic CRUD Operations

```typescript
// List test series with pagination
const testSeries = await testManagementService.testSeries.list({
  page: 1,
  limit: 10,
  search: 'math',
  status: 'active'
});

// Create a new test series
const newSeries = await testManagementService.testSeries.create({
  title: 'Advanced Mathematics',
  description: 'Comprehensive math test series',
  is_active: true
});

// Update existing test series
const updated = await testManagementService.testSeries.update(uuid, {
  title: 'Updated Title'
});

// Delete test series
await testManagementService.testSeries.delete(uuid);
```

### Nested Resource Operations

```typescript
// List categories under a test series
const categories = await testManagementService.categories.list(testSeriesUuid, {
  page: 1,
  limit: 20
});

// Create category under test series
const category = await testManagementService.categories.create(testSeriesUuid, {
  name: 'Algebra',
  description: 'Algebra topics',
  is_active: true
});
```

### Bulk Operations

```typescript
// Bulk activate multiple questions
await testManagementService.questions.bulkOperations({
  action: 'activate',
  uuids: ['uuid1', 'uuid2', 'uuid3']
});

// Bulk delete tests
await testManagementService.tests.bulkOperations({
  action: 'delete',
  uuids: selectedTestUuids
});
```

## Error Handling

The API client includes comprehensive error handling:

```typescript
// Automatic error handling in interceptors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    switch (error.response?.status) {
      case 401:
        // Auto-logout and redirect
        sessionStorage.clear();
        window.location.href = '/login';
        break;
      case 422:
        // Show validation errors
        toast.error(extractValidationError(error));
        break;
      // ... other cases
    }
    return Promise.reject(error);
  }
);
```

## Configuration

### Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5004/api
VITE_API_TIMEOUT=30000
```

### Axios Instance Configuration

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Type Safety Features

### Generic Service Types

```typescript
// Fully typed service methods
interface ApiService<TEntity, TFormData> {
  list(params?: PaginationParams): Promise<ApiListResponse<TEntity>>;
  create(data: TFormData): Promise<TEntity>;
  update(uuid: string, data: Partial<TFormData>): Promise<TEntity>;
  delete(uuid: string): Promise<void>;
  bulkOperations(params: BulkOperationParams): Promise<BulkOperationResponse>;
}
```

### Request/Response Typing

```typescript
// All API calls are fully typed
const response: ApiListResponse<TestSeries> = await testManagementService.testSeries.list();
const testSeries: TestSeries[] = response.data;
const pagination: PaginationResponse = response.pagination;
```

## Best Practices

### 1. **Always Use the Service Layer**
```typescript
// ✅ Good
import { testManagementService } from '../services/test-management.service';
const data = await testManagementService.testSeries.list();

// ❌ Bad
import { api } from '../lib/api/client';
const response = await api.get('/admin/test-management');
```

### 2. **Use Proper Error Handling**
```typescript
try {
  const result = await testManagementService.testSeries.create(formData);
  toast.success('Test series created successfully');
} catch (error) {
  toast.error(extractErrorMessage(error));
}
```

### 3. **Leverage TypeScript**
```typescript
// TypeScript will enforce proper typing
const formData: TestSeriesFormData = {
  title: 'Math Series',
  description: 'Advanced mathematics',
  is_active: true
};
```

## Migration Guide

### From Old Service to New Service

```typescript
// ❌ Old way (with BASE_URL concatenation)
const response = await api.get(\`\${BASE_URL}/test-series\`);

// ✅ New way (using service)
const response = await testManagementService.testSeries.list();
```

### Component Updates

```typescript
// Update component imports
import { testManagementService } from '../services/test-management.service';
import type { TestSeries, TestSeriesFormData } from '../types/test-management';

// Use typed service methods
const { data } = useQuery({
  queryKey: ['testSeries', filters],
  queryFn: () => testManagementService.testSeries.list(filters),
});
```

## Testing

### Service Testing

```typescript
// Mock the service for testing
jest.mock('../services/test-management.service', () => ({
  testManagementService: {
    testSeries: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
```

### Component Testing

```typescript
// Test components with mocked services
const mockList = jest.fn().mockResolvedValue(mockTestSeriesResponse);
testManagementService.testSeries.list = mockList;

render(<TestManagementPage />);
expect(mockList).toHaveBeenCalledWith(expectedFilters);
```

## Performance Considerations

### Request Optimization

- Query parameter building is optimized
- Axios interceptors handle common concerns
- Response caching can be added at service level

### Memory Management

- Services are singletons (no multiple instances)
- Proper cleanup in error handling
- TypeScript prevents memory leaks from type mismatches

## Conclusion

This new API architecture provides:

1. **Consistency**: All API calls follow the same patterns
2. **Type Safety**: Full TypeScript coverage
3. **Maintainability**: Centralized configuration and logic
4. **Scalability**: Easy to add new services and endpoints
5. **Developer Experience**: Clear patterns and comprehensive documentation

The elimination of hardcoded BASE_URL concatenation and the implementation of proper service layers significantly improves code quality and maintainability.