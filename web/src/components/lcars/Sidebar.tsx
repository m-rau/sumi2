import { NavLink } from 'react-router-dom'
import { Users, LayoutDashboard, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roles', label: 'Roles', icon: Users },
]

interface LcarsSidebarProps {
  className?: string
}

export function LcarsSidebar({ className }: LcarsSidebarProps) {
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        'w-64 bg-surface-dark flex flex-col',
        className
      )}
    >
      <div className="flex-1 py-6">
        <nav className="space-y-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-150',
                  'text-text-light hover:bg-lcars-orange hover:text-black',
                  'font-medium tracking-wide uppercase',
                  isActive && 'bg-lcars-orange text-black'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-surface-panel">
        <div className="flex items-center gap-3 text-text-muted">
          <Shield className="w-4 h-4" />
          <span className="text-sm">
            {user?.permissions.length ?? 0} permissions
          </span>
        </div>
      </div>

      {/* LCARS decorative elements */}
      <div className="px-3 pb-6 space-y-2">
        <div className="h-3 bg-lcars-lavender rounded-r-full" />
        <div className="h-3 bg-lcars-periwinkle rounded-r-full w-3/4" />
        <div className="h-3 bg-lcars-sky rounded-r-full w-1/2" />
      </div>
    </aside>
  )
}
