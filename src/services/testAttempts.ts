import api from './api';

export type AttemptStatus = 'active' | 'paused' | 'completed' | 'expired' | 'cancelled';

export interface LatestAttempt {
  sessionId: string;
  testName: string | null;
  categoryName: string | null;
  status: AttemptStatus;
  isCompleted: boolean;
  isSubmitted: boolean;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  percentage: number | null;
  finalScore: number | null;
  timeSpentSeconds: number | null;
}

export interface StudentTestActivity {
  studentUuid: string;
  studentName: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSignedUpAt: string | null;
  totalAttempts: number;
  completedAttempts: number;
  latestAttempt: LatestAttempt | null;
}

export interface StudentActivityResponse {
  success: boolean;
  data: StudentTestActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StudentTestActivityFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: AttemptStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentAttemptDetail {
  sessionId: string;
  testName: string | null;
  categoryName: string | null;
  seriesName: string | null;
  subCategoryName: string | null;
  hierarchyPath: string;
  status: AttemptStatus;
  isCompleted: boolean;
  isSubmitted: boolean;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  percentage: number | null;
  finalScore: number | null;
  timeSpentSeconds: number | null;
}

export interface StudentHistoryResponse {
  success: boolean;
  data: {
    student: {
      uuid: string;
      name: string;
      email: string;
      phone: string | null;
      isEmailVerified: boolean;
      isActive: boolean;
      signedUpAt: string;
    };
    summary: {
      totalAttempts: number;
      completedAttempts: number;
      inProgressAttempts: number;
      uniqueTests: number;
      uniqueSeries: number;
      avgPercentage: number | null;
    };
    attempts: StudentAttemptDetail[];
  };
}

export const testAttemptsService = {
  // List of students with their latest attempt summary (one row per student)
  getStudentActivity: async (filters: StudentTestActivityFilters = {}): Promise<StudentActivityResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await api.get(`/admin/test-attempts?${params.toString()}`);
    return response.data;
  },

  // Full attempt history for a single student (modal view)
  getStudentHistory: async (studentUuid: string): Promise<StudentHistoryResponse> => {
    const response = await api.get(`/admin/users/${studentUuid}/test-attempts`);
    return response.data;
  },
};
