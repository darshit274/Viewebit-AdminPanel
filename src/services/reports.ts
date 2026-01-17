import api from './api';
import {
  ApiResponse,
  ReportsDashboardResponse,
  QuestionReportsDetailResponse,
  ReportsFilterParams,
  UpdateReportStatusRequest,
  BulkActionRequest,
  BulkActionResponse,
  QuestionReport,
} from '../types/reports';

export const reportsService = {
  /**
   * Get reports dashboard data
   * Shows all questions with reports, grouped and filtered
   */
  getDashboard: async (
    params: ReportsFilterParams = {}
  ): Promise<ApiResponse<ReportsDashboardResponse>> => {
    const queryParams = new URLSearchParams();

    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }

    if (params.reportType && params.reportType !== 'all') {
      queryParams.append('reportType', params.reportType);
    }

    if (params.testSeriesId) {
      queryParams.append('testSeriesId', params.testSeriesId.toString());
    }

    if (params.search) {
      queryParams.append('search', params.search);
    }

    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = `/admin/reports${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get all reports for a specific question
   * Shows detailed view with full question content and all reports
   */
  getQuestionReports: async (
    questionId: number,
    filters: { status?: string; sortBy?: string } = {}
  ): Promise<ApiResponse<QuestionReportsDetailResponse>> => {
    const queryParams = new URLSearchParams();

    if (filters.status) {
      queryParams.append('status', filters.status);
    }

    if (filters.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
    }

    const queryString = queryParams.toString();
    const url = `/admin/reports/question/${questionId}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Update status of a single report
   * Allows admin to mark report as under_review, resolved, or rejected
   */
  updateReportStatus: async (
    reportId: string,
    data: UpdateReportStatusRequest
  ): Promise<ApiResponse<QuestionReport>> => {
    const response = await api.patch(`/admin/reports/${reportId}/status`, data);
    return response.data;
  },

  /**
   * Bulk update all reports for a question
   * Allows resolving/rejecting all reports at once
   */
  bulkUpdateReports: async (
    questionId: number,
    data: BulkActionRequest
  ): Promise<ApiResponse<BulkActionResponse>> => {
    const response = await api.patch(
      `/admin/reports/question/${questionId}/bulk-action`,
      data
    );
    return response.data;
  },

  /**
   * Get pending reports count for sidebar badge
   */
  getPendingCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get('/admin/reports?status=pending&limit=1');
    return {
      success: true,
      data: { count: response.data.data.pagination.totalItems },
      message: 'Pending count retrieved',
    };
  },
};
