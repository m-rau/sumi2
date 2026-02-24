import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface LcarsPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'highlighted'
  corner?: 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'all'
  header?: ReactNode
  headerColor?: 'orange' | 'lavender' | 'periwinkle' | 'sky' | 'sage' | 'gold' | 'salmon'
}

const cornerStyles = {
  none: '',
  'top-left': 'rounded-tl-[2.5rem]',
  'top-right': 'rounded-tr-[2.5rem]',
  'bottom-left': 'rounded-bl-[2.5rem]',
  'bottom-right': 'rounded-br-[2.5rem]',
  all: 'rounded-[2.5rem]',
}

const headerColorStyles = {
  orange: 'bg-lcars-orange',
  lavender: 'bg-lcars-lavender',
  periwinkle: 'bg-lcars-periwinkle',
  sky: 'bg-lcars-sky',
  sage: 'bg-lcars-sage',
  gold: 'bg-lcars-gold',
  salmon: 'bg-lcars-salmon',
}

export const LcarsPanel = forwardRef<HTMLDivElement, LcarsPanelProps>(
  (
    {
      className,
      variant = 'default',
      corner = 'none',
      header,
      headerColor = 'orange',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-dark overflow-hidden',
          variant === 'bordered' && 'border-2 border-lcars-orange',
          variant === 'highlighted' && 'lcars-panel-glow',
          cornerStyles[corner],
          className
        )}
        {...props}
      >
        {header && (
          <div
            className={cn(
              'px-6 py-3 text-black font-bold uppercase tracking-wider',
              headerColorStyles[headerColor]
            )}
          >
            {header}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    )
  }
)

LcarsPanel.displayName = 'LcarsPanel'
