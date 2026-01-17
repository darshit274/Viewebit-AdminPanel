// Question Report Types

export type ReportType = 'wrong_question' | 'wrong_solution' | 'other';
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';
export type UrgencyLevel = 'high' | 'medium' | 'normal';

export interface QuestionReport {
  id: number;
  uuid: string;
  questionId: number;
  userId: number;
  reportType: ReportType;
  reportText: string | null;
  userSelectedAnswer: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Populated relations
  user?: {
    id: number;
    uuid: string;
    email: string;
    username: string;
  };

  reviewer?: {
    id: number;
    uuid: string;
    email: string;
    username: string;
  } | null;
}

export interface ReportBreakdown {
  wrong_question: number;
  wrong_solution: number;
  other: number;
}

export interface StatusBreakdown {
  pending: number;
  under_review: number;
  resolved: number;
  rejected: number;
}

export interface HierarchyPathItem {
  id: number;
  uuid: string;
  name: string;
  type: 'test_series' | 'category' | 'subcategory' | 'test';
}

export interface QuestionWithReports {
  questionId: number;
  questionUuid: string;
  questionText: string;
  questionTextGujarati?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';

  // Test series info
  testSeries: {
    id: number;
    uuid: string;
    name: string;
  };

  // Hierarchy path
  hierarchyPath: HierarchyPathItem[];
  hierarchyString: string;

  // Report statistics
  totalReports: number;
  reportBreakdown: ReportBreakdown;
  statusBreakdown: StatusBreakdown;

  // Latest report info
  latestReport: {
    reportId: string;
    userId: number;
    userEmail: string;
    reportType: ReportType;
    reportText: string | null;
    status: ReportStatus;
    createdAt: string;
  };

  // Urgency level (high: 10+, medium: 5-9, normal: 1-4)
  urgencyLevel: UrgencyLevel;
}

export interface QuestionDetails {
  id: number;
  uuid: string;
  questionText: string;
  questionTextGujarati?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionsGujarati?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanationGujarati?: string;
  marks: number;
  negativeMarks?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  topic?: string;

  // Test series info
  testSeries: {
    id: number;
    uuid: string;
    name: string;
  };

  // Hierarchy path
  hierarchyPath: HierarchyPathItem[];
}

export interface QuestionReportsDetailResponse {
  question: QuestionDetails;
  reports: QuestionReport[];
  summary: {
    totalReports: number;
    reportBreakdown: ReportBreakdown;
    statusBreakdown: StatusBreakdown;
  };
}

export interface ReportsDashboardResponse {
  questions: QuestionWithReports[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalPending: number;
    totalUnderReview: number;
    totalResolved: number;
    totalRejected: number;
  };
}

// Filter params
export interface ReportsFilterParams {
  status?: 'all' | ReportStatus;
  reportType?: 'all' | ReportType;
  testSeriesId?: number;
  search?: string;
  sortBy?: 'reportCount' | 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

// Update report request
export interface UpdateReportStatusRequest {
  status: ReportStatus;
  adminNotes?: string;
}

// Bulk action request
export interface BulkActionRequest {
  action: 'resolve_all' | 'reject_all' | 'mark_under_review';
  adminNotes?: string;
  filterStatus?: 'pending' | 'under_review';
}

export interface BulkActionResponse {
  questionId: number;
  action: string;
  updatedCount: number;
  updatedReports: Array<{
    reportId: string;
    status: ReportStatus;
  }>;
  reviewedBy: number;
  reviewedAt: string;
}
