import { Sun, Moon, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { LcarsButton } from './Button'

interface LcarsHeaderProps {
  className?: string
}

export function LcarsHeader({ className }: LcarsHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-3 bg-surface-dark border-b-4 border-lcars-orange',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 bg-lcars-orange rounded-l-full" />
          <div className="w-8 h-8 bg-lcars-lavender" />
          <div className="w-8 h-8 bg-lcars-periwinkle rounded-r-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-lcars-orange uppercase">
          SUMI2 RBAC
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-panel rounded-full">
            <User className="w-4 h-4 text-lcars-sky" />
            <span className="text-lcars-sky font-medium">{user.username}</span>
            {user.operator && (
              <span className="px-2 py-0.5 text-xs bg-lcars-gold text-black rounded-full font-bold">
                OPERATOR
              </span>
            )}
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-surface-panel text-lcars-gold hover:bg-lcars-gold hover:text-black transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user && (
          <LcarsButton variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </LcarsButton>
        )}
      </div>
    </header>
  )
}
