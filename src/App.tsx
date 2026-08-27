import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth, ProtectedRoute } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { StudentsPage } from './pages/users/StudentsPage';
import { TestAttemptsPage } from './pages/users/TestAttemptsPage';
import { QuestionsPage } from './pages/questions/QuestionsPage';
// PDFManagement (flat library) removed — PDFs now live inside the hierarchy only.
import PdfHierarchyPage from './pages/PdfHierarchyPage';
import { ExamManagement } from './pages/ExamManagement';
import PYQManagement from './pages/PYQManagement';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { PerformanceReportsPage } from './pages/performance/PerformanceReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import TestManagementPageNew from './pages/TestManagementPageNew';
import TestSeriesDetailPageNew from './pages/TestSeriesDetailPageNew';
import CategoryDetailPageNew from './pages/CategoryDetailPageNew';
import SubCategoryDetailPageNew from './pages/SubCategoryDetailPageNew';
import TestDetailPageNew from './pages/TestDetailPageNew';
import DynamicHierarchyPage from './pages/DynamicHierarchyPage';
import SimpleDynamicHierarchyPage from './pages/SimpleDynamicHierarchyPage';
import { ReportsDashboard } from './pages/reports/ReportsDashboard';
import { QuestionReportDetails } from './pages/reports/QuestionReportDetails';
import QueriesPage from './pages/QueriesPage';
import AssessmentsPage from './pages/AssessmentsPage';
import { InstitutionsPage } from './pages/institutions/InstitutionsPage';
import { BranchesPage } from './pages/branches/BranchesPage';
import { BranchDetailPage } from './pages/branches/BranchDetailPage';
import RevenuePage from './pages/revenue/RevenuePage';
import { RolesPermissionsPage } from './pages/roles/RolesPermissionsPage';
import { AdmissionsPage } from './pages/admissions/AdmissionsPage';
import { EducatorsPage } from './pages/educators/EducatorsPage';
import AdminCoursesPage from './pages/courses/AdminCoursesPage';
import DataSubjectRequestsPage from './pages/privacy/DataSubjectRequestsPage';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Auth wrapper component
const AuthWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => navigate('/dashboard')} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="students" element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="test-attempts" element={
          <ProtectedRoute>
            <TestAttemptsPage />
          </ProtectedRoute>
        } />
        <Route path="test-management" element={
          <ProtectedRoute>
            <TestManagementPageNew />
          </ProtectedRoute>
        } />
        <Route path="courses" element={
          <ProtectedRoute>
            <AdminCoursesPage />
          </ProtectedRoute>
        } />
        <Route path="test-series/:testSeriesUuid" element={
          <ProtectedRoute>
            <TestSeriesDetailPageNew />
          </ProtectedRoute>
        } />
        <Route path="dynamic-hierarchy/:testSeriesId" element={
          <ProtectedRoute>
            <DynamicHierarchyPage />
          </ProtectedRoute>
        } />
        <Route path="simple-hierarchy/:testSeriesUuid" element={
          <ProtectedRoute>
            <SimpleDynamicHierarchyPage />
          </ProtectedRoute>
        } />
        <Route path="simple-hierarchy/:testSeriesUuid/categories/:categoryUuid" element={
          <ProtectedRoute>
            <SimpleDynamicHierarchyPage />
          </ProtectedRoute>
        } />
        <Route path="categories/:categoryUuid" element={
          <ProtectedRoute>
            <CategoryDetailPageNew />
          </ProtectedRoute>
        } />
        <Route path="sub-categories/:subCategoryUuid" element={
          <ProtectedRoute>
            <SubCategoryDetailPageNew />
          </ProtectedRoute>
        } />
        <Route path="tests/:testUuid" element={
          <ProtectedRoute>
            <TestDetailPageNew />
          </ProtectedRoute>
        } />
        <Route path="questions" element={
          <ProtectedRoute>
            <QuestionsPage />
          </ProtectedRoute>
        } />
        {/* The standalone /pdfs (flat library) route is removed — PDFs only live inside the hierarchy now. */}
        <Route path="pdfs" element={<Navigate to="/pdf-hierarchy" replace />} />
        <Route path="pdf-hierarchy" element={
          <ProtectedRoute>
            <PdfHierarchyPage />
          </ProtectedRoute>
        } />
        <Route path="pdf-hierarchy/categories/:categoryUuid" element={
          <ProtectedRoute>
            <PdfHierarchyPage />
          </ProtectedRoute>
        } />
        <Route path="queries" element={
          <ProtectedRoute>
            <QueriesPage />
          </ProtectedRoute>
        } />
        <Route path="assessments" element={
          <ProtectedRoute>
            <AssessmentsPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute>
            <ReportsDashboard />
          </ProtectedRoute>
        } />
        <Route path="reports/question/:questionId" element={
          <ProtectedRoute>
            <QuestionReportDetails />
          </ProtectedRoute>
        } />
        <Route path="subscriptions" element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        } />
        <Route path="exams" element={
          <ProtectedRoute>
            <ExamManagement />
          </ProtectedRoute>
        } />
        <Route path="pyqs" element={
          <ProtectedRoute>
            <PYQManagement />
          </ProtectedRoute>
        } />
        <Route path="categories" element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="performance" element={
          <ProtectedRoute>
            <PerformanceReportsPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="institutions" element={
          <ProtectedRoute>
            <InstitutionsPage />
          </ProtectedRoute>
        } />
        <Route path="branches" element={
          <ProtectedRoute>
            <BranchesPage />
          </ProtectedRoute>
        } />
        <Route path="branches/:branchUuid" element={
          <ProtectedRoute>
            <BranchDetailPage />
          </ProtectedRoute>
        } />
        <Route path="roles" element={
          <ProtectedRoute>
            <RolesPermissionsPage />
          </ProtectedRoute>
        } />
        <Route path="admissions" element={
          <ProtectedRoute>
            <AdmissionsPage />
          </ProtectedRoute>
        } />
        <Route path="educators" element={
          <ProtectedRoute>
            <EducatorsPage />
          </ProtectedRoute>
        } />
        <Route path="revenue" element={
          <ProtectedRoute>
            <RevenuePage />
          </ProtectedRoute>
        } />
        <Route path="privacy-requests" element={
          <ProtectedRoute>
            <DataSubjectRequestsPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename={import.meta.env.VITE_BASE_PATH || '/'}>
          <div className="App">
            <AuthWrapper />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;