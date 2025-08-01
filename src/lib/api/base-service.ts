import { AxiosRequestConfig } from 'axios';
import { api } from './client';
import { buildEndpoint } from './endpoints';

/**
 * Base API Service Class
 * 
 * Provides common CRUD operations and utilities for all API services.
 * Uses proper axios instance without URL concatenation.
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any;
}

// Base bulk operation interface
export interface BaseBulkOperationParams {
  action: 'activate' | 'deactivate' | 'delete';
}

// Entity-specific bulk operation interfaces (matching backend expectations)
export interface TestSeriesBulkOperationParams extends BaseBulkOperationParams {
  testSeriesIds: string[];
}

export interface CategoryBulkOperationParams extends BaseBulkOperationParams {
  categoryIds: string[];
}

export interface SubCategoryBulkOperationParams extends BaseBulkOperationParams {
  subCategoryIds: string[];
}

export interface TestBulkOperationParams extends BaseBulkOperationParams {
  testIds: string[];
}

export interface QuestionBulkOperationParams extends BaseBulkOperationParams {
  questionIds: string[];
}

// Generic bulk operation params (deprecated - use entity-specific ones)
export interface BulkOperationParams extends BaseBulkOperationParams {
  uuids: string[];
}

export interface BulkOperationResponse {
  success: boolean;
  action: string;
  processedCount: number;
  message: string;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: Record<string, any>;
}

// Special interface for nested resource responses (like categories under test series)
export interface NestedApiListResponse<TParent, TChild> {
  testSeries?: TParent;
  categories?: TChild[];
  subCategories?: TChild[];
  tests?: TChild[];
  questions?: TChild[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: Record<string, any>;
}

/**
 * Base service class providing common CRUD operations
 */
export abstract class BaseApiService<TEntity, TFormData, TBulkParams = BulkOperationParams> {
  protected abstract endpoints: {
    list: string;
    byId: (uuid: string) => string;
    create: string;
    bulk: string;
  };

  /**
   * List entities with pagination and filtering
   */
  async list(params: PaginationParams = {}): Promise<ApiListResponse<TEntity>> {
    const endpoint = buildEndpoint(this.endpoints.list, params);
    return api.get<ApiListResponse<TEntity>>(endpoint);
  }
  
  /**
   * Get single entity by UUID
   */
  async getById(uuid: string): Promise<TEntity> {
    return api.get<TEntity>(this.endpoints.byId(uuid));
  }
  
  /**
   * Create new entity
   */
  async create(data: TFormData): Promise<TEntity> {
    return api.post<TEntity>(this.endpoints.create, data);
  }
  
  /**
   * Update existing entity
   */
  async update(uuid: string, data: Partial<TFormData>): Promise<TEntity> {
    return api.put<TEntity>(this.endpoints.byId(uuid), data);
  }
  
  /**
   * Delete entity
   */
  async delete(uuid: string): Promise<void> {
    return api.delete<void>(this.endpoints.byId(uuid));
  }
  
  /**
   * Bulk operations (activate, deactivate, delete)
   * Uses entity-specific bulk operation parameters
   */
  async bulkOperations(params: TBulkParams): Promise<BulkOperationResponse> {
    return api.post<BulkOperationResponse>(this.endpoints.bulk, params);
  }
}

/**
 * Nested resource service for entities that belong to a parent resource
 */
export abstract class NestedApiService<TEntity, TFormData, TBulkParams = BulkOperationParams> {
  protected abstract endpoints: {
    list: (parentUuid: string) => string;
    byId: (uuid: string) => string;
    create: (parentUuid: string) => string;
    bulk: string;
  };

  /**
   * List entities under a parent resource
   */
  async list(parentUuid: string, params: PaginationParams = {}): Promise<ApiListResponse<TEntity>> {
    const endpoint = buildEndpoint(this.endpoints.list(parentUuid), params);
    return api.get<ApiListResponse<TEntity>>(endpoint);
  }
  
  /**
   * Get single entity by UUID
   */
  async getById(uuid: string): Promise<TEntity> {
    return api.get<TEntity>(this.endpoints.byId(uuid));
  }
  
  /**
   * Create new entity under parent resource
   */
  async create(parentUuid: string, data: TFormData): Promise<TEntity> {
    return api.post<TEntity>(this.endpoints.create(parentUuid), data);
  }
  
  /**
   * Update existing entity
   */
  async update(uuid: string, data: Partial<TFormData>): Promise<TEntity> {
    return api.put<TEntity>(this.endpoints.byId(uuid), data);
  }
  
  /**
   * Delete entity
   */
  async delete(uuid: string): Promise<void> {
    return api.delete<void>(this.endpoints.byId(uuid));
  }
  
  /**
   * Bulk operations (activate, deactivate, delete)
   */
  async bulkOperations(params: TBulkParams): Promise<BulkOperationResponse> {
    return api.post<BulkOperationResponse>(this.endpoints.bulk, params);
  }
}

/**
 * Service factory for creating typed API services
 */
export function createApiService<TEntity, TFormData, TBulkParams = BulkOperationParams>(endpoints: {
  list: string;
  byId: (uuid: string) => string;
  create: string;
  bulk: string;
}) {
  return new (class extends BaseApiService<TEntity, TFormData, TBulkParams> {
    protected endpoints = endpoints;
  })();
}

export function createNestedApiService<TEntity, TFormData, TBulkParams = BulkOperationParams>(endpoints: {
  list: (parentUuid: string) => string;
  byId: (uuid: string) => string;
  create: (parentUuid: string) => string;
  bulk: string;
}) {
  return new (class extends NestedApiService<TEntity, TFormData, TBulkParams> {
    protected endpoints = endpoints;
  })();
}

/**
 * Utility functions to convert between generic bulk params and entity-specific params
 */
export const BulkOperationHelpers = {
  /**
   * Convert generic bulk operation params to TestSeries-specific params
   */
  forTestSeries(action: 'activate' | 'deactivate' | 'delete', uuids: string[]): TestSeriesBulkOperationParams {
    return { action, testSeriesIds: uuids };
  },

  /**
   * Convert generic bulk operation params to Category-specific params
   */
  forCategories(action: 'activate' | 'deactivate' | 'delete', uuids: string[]): CategoryBulkOperationParams {
    return { action, categoryIds: uuids };
  },

  /**
   * Convert generic bulk operation params to SubCategory-specific params
   */
  forSubCategories(action: 'activate' | 'deactivate' | 'delete', uuids: string[]): SubCategoryBulkOperationParams {
    return { action, subCategoryIds: uuids };
  },

  /**
   * Convert generic bulk operation params to Test-specific params
   */
  forTests(action: 'activate' | 'deactivate' | 'delete', uuids: string[]): TestBulkOperationParams {
    return { action, testIds: uuids };
  },

  /**
   * Convert generic bulk operation params to Question-specific params
   */
  forQuestions(action: 'activate' | 'deactivate' | 'delete', uuids: string[]): QuestionBulkOperationParams {
    return { action, questionIds: uuids };
  },
};