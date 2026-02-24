import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider, LcarsLayout } from '@/components/lcars'
import { LoginPage } from '@/pages/Login'
import { ForgotPasswordPage } from '@/pages/ForgotPassword'
import { ResetPasswordPage } from '@/pages/ResetPassword'
import { DashboardPage } from '@/pages/Dashboard'
import { RolesPage } from '@/pages/RolesPage'
import { RoleDetailPage } from '@/pages/RoleDetailPage'
import { RoleEditPage } from '@/pages/RoleEditPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LcarsLayout>
              <DashboardPage />
            </LcarsLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <LcarsLayout>
              <RolesPage />
            </LcarsLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles/new"
        element={
          <ProtectedRoute requireOperator>
            <LcarsLayout>
              <RoleEditPage />
            </LcarsLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles/:identifier"
        element={
          <ProtectedRoute>
            <LcarsLayout>
              <RoleDetailPage />
            </LcarsLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles/:identifier/edit"
        element={
          <ProtectedRoute requireOperator>
            <LcarsLayout>
              <RoleEditPage />
            </LcarsLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
