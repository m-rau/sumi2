export interface Token {
  access_token: string
  token_type: string
}

export interface MeResponse {
  role_id: string
  username: string
  realname: string
  email: string | null
  operator: boolean
  active: boolean
  permissions: string[]
  created_at: string | null
  last_login: string | null
}

export interface ProfileUpdate {
  realname?: string
  email?: string | null
  password?: string
}

export interface RoleResponse {
  version_id: string
  role_id: string
  username: string
  realname: string
  email: string | null
  operator: boolean
  active: boolean
  permissions: string
  roles: string[]
  last_login: string | null
  modified_by: string | null
  modified_at: string
  created_at: string | null
}

export interface PaginatedRolesResponse {
  items: RoleResponse[]
  total: number
  offset: number
  limit: number
  has_more: boolean
}

export interface RoleHistoryResponse {
  versions: RoleResponse[]
  total: number
}

export interface ResolvedPermissions {
  role_id: string
  username: string
  permissions: string[]
  inherited_from: string[]
}

export interface RoleCreate {
  username: string
  realname: string
  email?: string | null
  password?: string | null
  operator?: boolean
  active?: boolean
  permissions?: string
  roles?: string[]
}

export interface RoleUpdate {
  username: string
  realname: string
  email?: string | null
  password?: string | null
  operator: boolean
  active: boolean
  permissions: string
  roles: string[]
}

export interface RolePatch {
  username?: string
  realname?: string
  email?: string
  password?: string
  operator?: boolean
  active?: boolean
  permissions?: string
  roles?: string[]
}

export interface ConflictError {
  detail: string
  error_code: 'CONCURRENT_MODIFICATION'
  current_version_id: string
}

export interface ApiError {
  detail: string
}

export function isConflictError(error: unknown): error is ConflictError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error_code' in error &&
    (error as ConflictError).error_code === 'CONCURRENT_MODIFICATION'
  )
}
