import { cn } from '@/lib/utils'

interface LcarsSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LcarsSpinner({ size = 'md', className }: LcarsSpinnerProps) {
  return (
    <div
      className={cn(
        'relative',
        sizeStyles[size],
        className
      )}
    >
      <div className="absolute inset-0 rounded-full border-4 border-surface-panel" />
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-lcars-orange animate-spin"
      />
    </div>
  )
}

export function LcarsLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LcarsSpinner size="lg" />
      <p className="text-lcars-orange font-medium uppercase tracking-wider lcars-pulse">
        {message}
      </p>
    </div>
  )
}
