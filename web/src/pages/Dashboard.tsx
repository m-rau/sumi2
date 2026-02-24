import { Users, Shield, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRoles } from '@/hooks/useRoles'
import { LcarsPanel, LcarsBadge } from '@/components/lcars'
import { formatRelativeTime } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: rolesData } = useRoles({ limit: 5 })

  const stats = [
    {
      label: 'Total Roles',
      value: rolesData?.total ?? '-',
      icon: Users,
      color: 'orange' as const,
    },
    {
      label: 'Your Permissions',
      value: user?.permissions.length ?? 0,
      icon: Shield,
      color: 'lavender' as const,
    },
    {
      label: 'Active Sessions',
      value: '-',
      icon: Activity,
      color: 'sage' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
          SYSTEM DASHBOARD
        </h1>
        <p className="text-text-muted">
          Welcome back, <span className="text-lcars-sky">{user?.realname}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <LcarsPanel
            key={stat.label}
            corner="top-left"
            headerColor={stat.color}
            header={stat.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-text-light">
                {stat.value}
              </span>
              <stat.icon className="w-10 h-10 text-text-muted" />
            </div>
          </LcarsPanel>
        ))}
      </div>

      {/* User Info Panel */}
      <LcarsPanel corner="top-right" header="User Profile" headerColor="periwinkle">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Username</label>
            <p className="text-lg text-text-light">{user?.username}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Real Name</label>
            <p className="text-lg text-text-light">{user?.realname}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Email</label>
            <p className="text-lg text-text-light">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Last Login</label>
            <p className="text-lg text-text-light">
              {formatRelativeTime(user?.last_login)}
            </p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Status</label>
            <div className="flex items-center gap-2 mt-1">
              <LcarsBadge variant={user?.active ? 'success' : 'danger'}>
                {user?.active ? 'Active' : 'Inactive'}
              </LcarsBadge>
              {user?.operator && (
                <LcarsBadge variant="operator">Operator</LcarsBadge>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Created</label>
            <p className="text-lg text-text-light">
              {formatRelativeTime(user?.created_at)}
            </p>
          </div>
        </div>
      </LcarsPanel>

      {/* Recent Activity */}
      <LcarsPanel corner="bottom-left" header="Recent Roles" headerColor="sky">
        {rolesData?.items.length === 0 ? (
          <p className="text-text-muted">No roles found</p>
        ) : (
          <div className="space-y-3">
            {rolesData?.items.map((role) => (
              <div
                key={role.role_id}
                className="flex items-center justify-between p-3 bg-surface-panel rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-lcars-sage" />
                  <div>
                    <p className="font-medium text-text-light">{role.username}</p>
                    <p className="text-sm text-text-muted">{role.realname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {role.operator && <LcarsBadge variant="operator">Op</LcarsBadge>}
                  <LcarsBadge variant={role.active ? 'success' : 'danger'}>
                    {role.active ? 'Active' : 'Inactive'}
                  </LcarsBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </LcarsPanel>
    </div>
  )
}
