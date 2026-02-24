import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const variantStyles = {
  success: {
    bg: 'bg-lcars-sage',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-lcars-salmon',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-lcars-gold',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-lcars-sky',
    icon: Info,
  },
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, variant }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    toast: addToast,
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => {
          const { bg, icon: Icon } = variantStyles[toast.variant]
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
                'animate-[slideIn_0.3s_ease-out] text-black font-medium',
                bg
              )}
              style={{
                // @ts-expect-error CSS custom property
                '--tw-animate-slideIn': 'translateX(100%) -> translateX(0)',
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
