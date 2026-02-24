import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MeResponse } from '@/types/api'

interface AuthContextValue {
  user: MeResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refetch: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthState() {
  const queryClient = useQueryClient()

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.getMe(),
    enabled: !!api.getToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      await api.login(username, password)
      return api.getMe()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
    },
  })

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password })
  }

  const logout = () => {
    api.logout()
    queryClient.setQueryData(['auth', 'me'], null)
    queryClient.clear()
  }

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  }
}
