import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LcarsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-lcars-orange text-black hover:bg-lcars-gold active:bg-lcars-orange-dark',
  secondary: 'bg-lcars-lavender text-black hover:bg-lcars-periwinkle active:bg-lcars-lavender-dark',
  accent: 'bg-lcars-periwinkle text-black hover:bg-lcars-sky active:bg-lcars-periwinkle-dark',
  danger: 'bg-lcars-salmon text-black hover:bg-red-400 active:bg-red-600',
  ghost: 'bg-transparent text-lcars-orange border-2 border-lcars-orange hover:bg-lcars-orange hover:text-black',
}

const sizeStyles = {
  sm: 'px-4 py-1.5 text-sm rounded-full',
  md: 'px-6 py-2 text-base rounded-full',
  lg: 'px-8 py-3 text-lg rounded-full',
}

export const LcarsButton = forwardRef<HTMLButtonElement, LcarsButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-bold uppercase tracking-wider transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-lcars-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

LcarsButton.displayName = 'LcarsButton'
