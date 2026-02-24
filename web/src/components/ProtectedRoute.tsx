import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LcarsLoadingScreen } from '@/components/lcars'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOperator?: boolean
}

export function ProtectedRoute({ children, requireOperator = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LcarsLoadingScreen message="Authenticating..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireOperator && !user?.operator) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
