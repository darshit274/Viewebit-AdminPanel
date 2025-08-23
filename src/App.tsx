import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth, ProtectedRoute } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { StudentsPage } from './pages/users/StudentsPage';
import { QuestionsPage } from './pages/questions/QuestionsPage';
import { PDFManagement } from './pages/PDFManagement';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => window.location.reload()} />;
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
        <Route path="test-management" element={
          <ProtectedRoute>
            <TestManagementPageNew />
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
        <Route path="pdfs" element={
          <ProtectedRoute>
            <PDFManagement />
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
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
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