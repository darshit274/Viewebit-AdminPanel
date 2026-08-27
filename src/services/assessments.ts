import api from './api';

export interface DimensionScores {
  aiFluency: number;
  workflowApplication: number;
  prompting: number;
  responsibleAI: number;
  organisationalReadiness: number;
}

export interface OpportunityOrGap {
  key: string;
  title: string;
  explanation: string;
}

export interface AssessmentLead {
  id: number;
  first_name: string;
  last_name: string;
  work_email: string;
  agency_name: string;
  job_title: string;
  employee_count_band: string;
  phone?: string;
  agency_type: string;
  current_ai_approach: string;
  answers: Record<string, unknown>;
  overall_score: number;
  maturity_level: 'ai_explorer' | 'early_adopter' | 'developing' | 'ai_ready' | 'ai_enabled';
  dimension_scores: DimensionScores;
  top_opportunities: OpportunityOrGap[];
  top_gaps: OpportunityOrGap[];
  recommended_priorities: string[];
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'closed';
  admin_notes?: string;
  contacted_at?: string;
  contacted_by?: number;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
  updated_at: string;
  contactedByAdmin?: { id: number; name: string; email: string };
}

export interface AssessmentListResponse {
  success: boolean;
  data: {
    leads: AssessmentLead[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    stats: { total: number; new: number; contacted: number; qualified: number };
  };
}

export interface AssessmentStatsResponse {
  success: boolean;
  data: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    unqualified: number;
    closed: number;
    todayCount: number;
    weekCount: number;
    recentLeads: Array<{
      id: number;
      first_name: string;
      last_name: string;
      agency_name: string;
      overall_score: number;
      maturity_level: string;
      status: string;
      created_at: string;
    }>;
  };
}

export interface UpdateLeadStatusData {
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'closed';
  admin_notes?: string;
}

export const assessmentService = {
  getAllLeads: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AssessmentListResponse> => {
    const response = await api.get('/assessment/admin/leads', { params });
    return response.data;
  },

  getLeadById: async (id: number): Promise<AssessmentLead> => {
    const response = await api.get(`/assessment/admin/leads/${id}`);
    return response.data.data;
  },

  updateLeadStatus: async (id: number, data: UpdateLeadStatusData): Promise<AssessmentLead> => {
    const response = await api.patch(`/assessment/admin/leads/${id}/status`, data);
    return response.data.data;
  },

  getStats: async (): Promise<AssessmentStatsResponse> => {
    const response = await api.get('/assessment/admin/leads/stats');
    return response.data;
  },

  deleteLead: async (id: number): Promise<void> => {
    await api.delete(`/assessment/admin/leads/${id}`);
  }
};
