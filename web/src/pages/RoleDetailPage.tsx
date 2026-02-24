import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, History, Shield, Users, Clock, Mail, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRole, useRolePermissions, useRoleHistory, useRollbackRole } from '@/hooks/useRoles'
import {
  LcarsPanel,
  LcarsButton,
  LcarsBadge,
  LcarsLoadingScreen,
  LcarsConfirmDialog,
  useToast,
} from '@/components/lcars'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { RoleResponse } from '@/types/api'
import { isConflictError } from '@/types/api'

export function RoleDetailPage() {
  const { identifier } = useParams<{ identifier: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [showHistory, setShowHistory] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<RoleResponse | null>(null)

  const { data: role, isLoading, refetch } = useRole(identifier)
  const { data: permissions } = useRolePermissions(identifier)
  const { data: history } = useRoleHistory(user?.operator ? identifier : undefined)

  const rollbackMutation = useRollbackRole()

  const handleRollback = async () => {
    if (!rollbackTarget || !role) return

    try {
      await rollbackMutation.mutateAsync({
        identifier: role.role_id,
        versionId: role.version_id,
      })
      toast.success('Role rolled back successfully')
      setRollbackTarget(null)
      refetch()
    } catch (err) {
      if (isConflictError(err)) {
        toast.error('Role was modified. Please refresh and try again.')
        refetch()
      } else {
        toast.error(err instanceof Error ? err.message : 'Rollback failed')
      }
    }
  }

  if (isLoading) {
    return <LcarsLoadingScreen message="Loading Role..." />
  }

  if (!role) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/roles"
            className="p-2 text-lcars-orange hover:bg-surface-panel rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-lcars-orange tracking-wider">
              {role.username}
            </h1>
            <p className="text-text-muted">{role.realname}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.operator && (
            <>
              <LcarsButton
                variant="secondary"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                {showHistory ? 'Hide' : 'Show'} History
              </LcarsButton>
              <LcarsButton onClick={() => navigate(`/roles/${identifier}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Role
              </LcarsButton>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <LcarsPanel corner="top-left" header="Role Information" headerColor="orange">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-lcars-lavender mt-1" />
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider">Username</label>
                  <p className="text-lg text-text-light">{role.username}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-lcars-lavender mt-1" />
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider">Real Name</label>
                  <p className="text-lg text-text-light">{role.realname}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-lcars-sky mt-1" />
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider">Email</label>
                  <p className="text-lg text-text-light">{role.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-lcars-gold mt-1" />
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider">Last Login</label>
                  <p className="text-lg text-text-light">{formatRelativeTime(role.last_login)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <LcarsBadge variant={role.active ? 'success' : 'danger'}>
                    {role.active ? 'Active' : 'Inactive'}
                  </LcarsBadge>
                  {role.operator && <LcarsBadge variant="operator">Operator</LcarsBadge>}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider">Created</label>
                <p className="text-lg text-text-light">{formatDate(role.created_at)}</p>
              </div>
            </div>
          </LcarsPanel>

          {/* Direct Permissions */}
          <LcarsPanel corner="bottom-left" header="Direct Permissions" headerColor="periwinkle">
            {role.permissions ? (
              <div className="space-y-2">
                {role.permissions.split('\n').filter(Boolean).map((perm, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-surface-panel rounded-lg font-mono text-sm"
                  >
                    <Shield className="w-4 h-4 text-lcars-periwinkle" />
                    <span className="text-text-light">{perm}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted">No direct permissions assigned</p>
            )}
          </LcarsPanel>

          {/* Parent Roles */}
          {role.roles.length > 0 && (
            <LcarsPanel corner="top-right" header="Parent Roles" headerColor="lavender">
              <div className="flex flex-wrap gap-2">
                {role.roles.map((parentRole) => (
                  <Link
                    key={parentRole}
                    to={`/roles/${parentRole}`}
                    className="flex items-center gap-2 px-4 py-2 bg-lcars-lavender text-black rounded-full font-medium hover:bg-lcars-periwinkle transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    {parentRole}
                  </Link>
                ))}
              </div>
            </LcarsPanel>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resolved Permissions */}
          <LcarsPanel corner="top-right" header="All Permissions" headerColor="sky">
            {permissions ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {permissions.permissions.length === 0 ? (
                  <p className="text-text-muted">No permissions</p>
                ) : (
                  permissions.permissions.map((perm, i) => (
                    <div
                      key={i}
                      className="p-2 bg-surface-panel rounded text-sm font-mono text-lcars-sky"
                    >
                      {perm}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-text-muted">Loading...</p>
            )}
            {permissions?.inherited_from.length ? (
              <div className="mt-4 pt-4 border-t border-surface-panel">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Inherited from:
                </p>
                <div className="flex flex-wrap gap-1">
                  {permissions.inherited_from.map((r) => (
                    <LcarsBadge key={r} variant="info">{r}</LcarsBadge>
                  ))}
                </div>
              </div>
            ) : null}
          </LcarsPanel>

          {/* Metadata */}
          <LcarsPanel corner="bottom-right" header="Metadata" headerColor="gold">
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-text-muted">Role ID</label>
                <p className="font-mono text-text-light break-all">{role.role_id}</p>
              </div>
              <div>
                <label className="text-text-muted">Version ID</label>
                <p className="font-mono text-text-light break-all">{role.version_id}</p>
              </div>
              <div>
                <label className="text-text-muted">Modified</label>
                <p className="text-text-light">{formatDate(role.modified_at)}</p>
              </div>
            </div>
          </LcarsPanel>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history && (
        <LcarsPanel corner="all" header="Version History" headerColor="sage">
          <div className="space-y-4">
            {history.versions.map((version, index) => (
              <div
                key={version.version_id}
                className={`p-4 rounded-lg border-2 ${
                  index === 0
                    ? 'border-lcars-sage bg-lcars-sage/10'
                    : 'border-surface-panel bg-surface-panel'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lcars-orange font-bold">
                      v{history.total - index}
                    </span>
                    {index === 0 && (
                      <LcarsBadge variant="success">Current</LcarsBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">
                      {formatDate(version.modified_at)}
                    </span>
                    {index > 0 && (
                      <LcarsButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setRollbackTarget(version)}
                      >
                        Rollback
                      </LcarsButton>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Username:</span>{' '}
                    <span className="text-text-light">{version.username}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Active:</span>{' '}
                    <span className={version.active ? 'text-lcars-sage' : 'text-lcars-salmon'}>
                      {version.active ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Operator:</span>{' '}
                    <span className={version.operator ? 'text-lcars-gold' : 'text-text-light'}>
                      {version.operator ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Roles:</span>{' '}
                    <span className="text-text-light">{version.roles.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LcarsPanel>
      )}

      {/* Rollback Confirmation */}
      <LcarsConfirmDialog
        open={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleRollback}
        title="Rollback Role"
        message="Are you sure you want to rollback to the previous version? This will create a new version with the previous data."
        confirmLabel="Rollback"
        variant="warning"
        loading={rollbackMutation.isPending}
      />
    </div>
  )
}
