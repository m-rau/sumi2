import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { RoleCreate, RoleUpdate, RolePatch } from '@/types/api'

export function useRoles(params: {
  offset?: number
  limit?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => api.getRoles(params),
  })
}

export function useRole(identifier: string | undefined) {
  return useQuery({
    queryKey: ['roles', identifier],
    queryFn: () => api.getRole(identifier!),
    enabled: !!identifier,
  })
}

export function useRolePermissions(identifier: string | undefined) {
  return useQuery({
    queryKey: ['roles', identifier, 'permissions'],
    queryFn: () => api.getRolePermissions(identifier!),
    enabled: !!identifier,
  })
}

export function useRoleHistory(identifier: string | undefined) {
  return useQuery({
    queryKey: ['roles', identifier, 'history'],
    queryFn: () => api.getRoleHistory(identifier!),
    enabled: !!identifier,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleCreate) => api.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      identifier,
      versionId,
      data,
    }: {
      identifier: string
      versionId: string
      data: RoleUpdate
    }) => api.updateRole(identifier, versionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['roles', variables.identifier] })
    },
  })
}

export function usePatchRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      identifier,
      versionId,
      data,
    }: {
      identifier: string
      versionId: string
      data: RolePatch
    }) => api.patchRole(identifier, versionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['roles', variables.identifier] })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (identifier: string) => api.deleteRole(identifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useRollbackRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      identifier,
      versionId,
    }: {
      identifier: string
      versionId: string
    }) => api.rollbackRole(identifier, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['roles', variables.identifier] })
    },
  })
}
