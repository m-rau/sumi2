import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react'
import { useRole, useUpdateRole, useCreateRole, useRoles } from '@/hooks/useRoles'
import {
  LcarsPanel,
  LcarsButton,
  LcarsInput,
  LcarsCheckbox,
  LcarsLoadingScreen,
  useToast,
} from '@/components/lcars'
import { isConflictError } from '@/types/api'

const roleSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  realname: z.string().min(1, 'Real name is required').max(200),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  password: z.string(),
  operator: z.boolean(),
  active: z.boolean(),
  permissions: z.string(),
  roles: z.array(z.string()),
})

type RoleForm = z.infer<typeof roleSchema>

export function RoleEditPage() {
  const { identifier } = useParams<{ identifier: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const isNew = !identifier || identifier === 'new'

  const { data: role, isLoading, refetch } = useRole(isNew ? undefined : identifier)
  const { data: allRoles } = useRoles({ limit: 100 })
  const updateMutation = useUpdateRole()
  const createMutation = useCreateRole()

  const [conflictError, setConflictError] = useState<string | null>(null)
  const [rolesInput, setRolesInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      username: '',
      realname: '',
      email: '',
      password: '',
      operator: false,
      active: true,
      permissions: '',
      roles: [],
    },
  })

  // Populate form when role loads
  useEffect(() => {
    if (role) {
      reset({
        username: role.username,
        realname: role.realname,
        email: role.email || '',
        password: '',
        operator: role.operator,
        active: role.active,
        permissions: role.permissions,
        roles: role.roles,
      })
      setRolesInput(role.roles.join(', '))
    }
  }, [role, reset])

  // Update roles array when input changes
  useEffect(() => {
    const rolesArray = rolesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
    setValue('roles', rolesArray)
  }, [rolesInput, setValue])

  const onSubmit = async (data: RoleForm) => {
    setConflictError(null)

    // Validate password for new roles with email (pure roles don't need password)
    if (isNew && data.email && data.password.length < 8) {
      setError('password', { message: 'Password must be at least 8 characters when email is set' })
      return
    }

    try {
      if (isNew) {
        await createMutation.mutateAsync({
          ...data,
          email: data.email || undefined,
          password: data.password || undefined,
        })
        toast.success('Role created successfully')
        navigate('/roles')
      } else if (role) {
        await updateMutation.mutateAsync({
          identifier: role.role_id,
          versionId: role.version_id,
          data: {
            ...data,
            email: data.email || undefined,
            password: data.password || undefined,
          },
        })
        toast.success('Role updated successfully')
        navigate(`/roles/${data.username}`)
      }
    } catch (err) {
      if (isConflictError(err)) {
        setConflictError('This role was modified by another user. Please refresh and try again.')
        refetch()
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save role')
      }
    }
  }

  const handleRefresh = () => {
    setConflictError(null)
    refetch()
  }

  if (!isNew && isLoading) {
    return <LcarsLoadingScreen message="Loading Role..." />
  }

  if (!isNew && !role) {
    return (
      <div className="text-center py-12">
        <p className="text-lcars-salmon text-xl mb-4">Role not found</p>
        <LcarsButton onClick={() => navigate('/roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Roles
        </LcarsButton>
      </div>
    )
  }

  const availableParentRoles = allRoles?.items.filter(
    (r) => r.username !== role?.username
  ) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={isNew ? '/roles' : `/roles/${identifier}`}
            className="p-2 text-lcars-orange hover:bg-surface-panel rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-lcars-orange tracking-wider">
              {isNew ? 'NEW ROLE' : 'EDIT ROLE'}
            </h1>
            {!isNew && <p className="text-text-muted">{role?.username}</p>}
          </div>
        </div>
      </div>

      {/* Conflict Warning */}
      {conflictError && (
        <div className="flex items-center justify-between p-4 bg-lcars-salmon/20 border border-lcars-salmon rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-lcars-salmon" />
            <p className="text-lcars-salmon">{conflictError}</p>
          </div>
          <LcarsButton variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </LcarsButton>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <LcarsPanel corner="top-left" header="Basic Information" headerColor="orange">
            <div className="space-y-4">
              <LcarsInput
                label="Username"
                placeholder="Enter username"
                error={errors.username?.message}
                {...register('username')}
              />
              <LcarsInput
                label="Real Name"
                placeholder="Enter full name"
                error={errors.realname?.message}
                {...register('realname')}
              />
              <LcarsInput
                label="Email (optional)"
                type="email"
                placeholder="Leave empty for pure permission role"
                error={errors.email?.message}
                {...register('email')}
              />
              <LcarsInput
                label={isNew ? 'Password (required if email set)' : 'Password (leave empty to keep current)'}
                type="password"
                placeholder={isNew ? 'Min 8 chars if email is set' : 'Leave empty to keep current'}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
          </LcarsPanel>

          {/* Status & Settings */}
          <LcarsPanel corner="top-right" header="Status & Settings" headerColor="lavender">
            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <LcarsCheckbox
                  label="Active"
                  checked={watch('active')}
                  {...register('active')}
                />
                <LcarsCheckbox
                  label="Operator"
                  checked={watch('operator')}
                  {...register('operator')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-lcars-orange mb-2">
                  Parent Roles
                </label>
                <input
                  type="text"
                  value={rolesInput}
                  onChange={(e) => setRolesInput(e.target.value)}
                  placeholder="Enter parent role usernames, comma separated"
                  className="w-full px-4 py-3 bg-surface-panel border-2 border-transparent rounded-lg text-text-light placeholder:text-text-muted focus:outline-none focus:border-lcars-orange transition-colors"
                />
                <p className="mt-1 text-xs text-text-muted">
                  Comma-separated list of parent role usernames
                </p>
                {availableParentRoles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {availableParentRoles.slice(0, 10).map((r) => (
                      <button
                        key={r.username}
                        type="button"
                        onClick={() => {
                          const current = rolesInput.split(',').map(s => s.trim()).filter(Boolean)
                          if (!current.includes(r.username)) {
                            setRolesInput([...current, r.username].join(', '))
                          }
                        }}
                        className="px-2 py-1 text-xs bg-surface-panel text-lcars-sky rounded hover:bg-lcars-sky hover:text-black transition-colors"
                      >
                        + {r.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </LcarsPanel>
        </div>

        {/* Permissions */}
        <LcarsPanel corner="bottom-left" header="Direct Permissions" headerColor="periwinkle">
          <div>
            <textarea
              placeholder="Enter permissions, one per line (e.g., read:/users/*, write:/posts/*)"
              rows={8}
              className="w-full px-4 py-3 bg-surface-panel border-2 border-transparent rounded-lg text-text-light placeholder:text-text-muted focus:outline-none focus:border-lcars-orange transition-colors font-mono text-sm resize-y"
              {...register('permissions')}
            />
            <p className="mt-2 text-xs text-text-muted">
              Enter permission strings, one per line. Format: action:resource (e.g., read:/users/*, write:/posts/*)
            </p>
          </div>
        </LcarsPanel>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to={isNew ? '/roles' : `/roles/${identifier}`}>
            <LcarsButton type="button" variant="ghost">
              Cancel
            </LcarsButton>
          </Link>
          <LcarsButton
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {isNew ? 'Create Role' : 'Save Changes'}
          </LcarsButton>
        </div>
      </form>
    </div>
  )
}
