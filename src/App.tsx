import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth, ProtectedRoute } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { StudentsPageFixed as StudentsPage } from './pages/users/StudentsPageFixed';
import { TestSeriesPage } from './pages/tests/TestSeriesPage';
import { QuestionsPage } from './pages/questions/QuestionsPage';
import { PDFManagement } from './pages/PDFManagement';
import { ExamManagement } from './pages/ExamManagement';
import { TopicTestSeriesManagement } from './pages/TopicTestSeriesManagement';
import { FreeTestsManagement } from './pages/FreeTestsManagement';
import PYQManagement from './pages/PYQManagement';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';

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
        <Route path="test-series" element={
          <ProtectedRoute>
            <TestSeriesPage />
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
        <Route path="subjects" element={
          <ProtectedRoute>
            <TopicTestSeriesManagement />
          </ProtectedRoute>
        } />
        <Route path="free-tests" element={
          <ProtectedRoute>
            <FreeTestsManagement />
          </ProtectedRoute>
        } />
        <Route path="pyqs" element={
          <ProtectedRoute>
            <PYQManagement />
          </ProtectedRoute>
        } />
        <Route path="categories" element={
          <ProtectedRoute>
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Category Management</h2>
              <p className="text-gray-600">Category management functionality coming soon...</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute>
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics functionality coming soon...</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="performance" element={
          <ProtectedRoute>
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Reports</h2>
              <p className="text-gray-600">Performance reports functionality coming soon...</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <p className="text-gray-600">Settings functionality coming soon...</p>
            </div>
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