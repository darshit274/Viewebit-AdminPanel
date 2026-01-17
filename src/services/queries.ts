import api from './api';

export interface Query {
  id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  query_message: string;
  status: 'pending' | 'viewed' | 'solved';
  admin_notes?: string;
  viewed_at?: string;
  viewed_by?: number;
  solved_at?: string;
  solved_by?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  viewedByAdmin?: {
    id: number;
    name: string;
    email: string;
  };
  solvedByAdmin?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface QueryListResponse {
  success: boolean;
  data: {
    queries: Query[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    stats: {
      total: number;
      pending: number;
      viewed: number;
      solved: number;
    };
  };
}

export interface QueryStatsResponse {
  success: boolean;
  data: {
    total: number;
    pending: number;
    viewed: number;
    solved: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    recentQueries: Array<{
      id: number;
      full_name: string;
      status: string;
      created_at: string;
    }>;
  };
}

export interface UpdateStatusData {
  status: 'viewed' | 'solved';
  admin_notes?: string;
}

export const queryService = {
  // Get all queries with filters and pagination
  getAllQueries: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<QueryListResponse> => {
    const response = await api.get('/contact/admin/queries', { params });
    return response.data;
  },

  // Get single query by ID
  getQueryById: async (id: number): Promise<Query> => {
    const response = await api.get(`/contact/admin/queries/${id}`);
    return response.data.data;
  },

  // Update query status
  updateQueryStatus: async (id: number, data: UpdateStatusData): Promise<Query> => {
    const response = await api.patch(`/contact/admin/queries/${id}/status`, data);
    return response.data.data;
  },

  // Delete query
  deleteQuery: async (id: number): Promise<void> => {
    await api.delete(`/contact/admin/queries/${id}`);
  },

  // Get query statistics
  getStats: async (): Promise<QueryStatsResponse> => {
    const response = await api.get('/contact/admin/queries/stats');
    return response.data;
  }
};
