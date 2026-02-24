import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LcarsButton } from './Button'

interface LcarsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function LcarsDialog({ open, onClose, title, children, className }: LcarsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 w-full max-w-lg bg-surface-dark rounded-[2rem] overflow-hidden',
          'border-4 border-lcars-orange lcars-panel-glow',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-lcars-orange">
          <h2
            id="dialog-title"
            className="text-xl font-bold uppercase tracking-wider text-black"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

interface LcarsConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

export function LcarsConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: LcarsConfirmDialogProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'

  return (
    <LcarsDialog open={open} onClose={onClose} title={title}>
      <p className="text-text-light mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <LcarsButton variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </LcarsButton>
        <LcarsButton variant={buttonVariant} onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing...' : confirmLabel}
        </LcarsButton>
      </div>
    </LcarsDialog>
  )
}
