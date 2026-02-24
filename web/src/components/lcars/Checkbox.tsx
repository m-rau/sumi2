import { forwardRef, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LcarsCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const LcarsCheckbox = forwardRef<HTMLInputElement, LcarsCheckboxProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const isChecked = checked ?? false

    return (
      <label
        htmlFor={inputId}
        className={cn('flex items-center gap-3 cursor-pointer group', className)}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            checked={checked}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-6 h-6 border-2 border-lcars-orange rounded transition-colors flex items-center justify-center',
              isChecked && 'bg-lcars-orange border-lcars-orange'
            )}
          >
            {isChecked && <Check className="w-4 h-4 text-black" />}
          </div>
        </div>
        {label && (
          <span className="text-text-light font-medium group-hover:text-lcars-orange transition-colors">
            {label}
          </span>
        )}
      </label>
    )
  }
)

LcarsCheckbox.displayName = 'LcarsCheckbox'
