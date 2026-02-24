import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LcarsInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const LcarsInput = forwardRef<HTMLInputElement, LcarsInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold uppercase tracking-wider text-lcars-orange"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 bg-surface-panel border-2 border-transparent rounded-lg',
            'text-text-light placeholder:text-text-muted',
            'focus:outline-none focus:border-lcars-orange',
            'transition-colors duration-150',
            error && 'border-lcars-salmon focus:border-lcars-salmon',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-lcars-salmon">{error}</p>
        )}
      </div>
    )
  }
)

LcarsInput.displayName = 'LcarsInput'
