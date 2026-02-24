import { cn } from '@/lib/utils'

export interface LcarsBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'operator'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  default: 'bg-lcars-lavender text-black',
  success: 'bg-lcars-sage text-black',
  warning: 'bg-lcars-gold text-black',
  danger: 'bg-lcars-salmon text-black',
  info: 'bg-lcars-sky text-black',
  operator: 'bg-lcars-gold text-black',
}

export function LcarsBadge({ variant = 'default', children, className }: LcarsBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
