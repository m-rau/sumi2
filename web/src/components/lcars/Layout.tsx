import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LcarsHeader } from './Header'
import { LcarsSidebar } from './Sidebar'

interface LcarsLayoutProps {
  children: ReactNode
  className?: string
}

export function LcarsLayout({ children, className }: LcarsLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <LcarsHeader />
      <div className="flex flex-1 overflow-hidden">
        <LcarsSidebar />
        <main
          className={cn(
            'flex-1 overflow-auto p-6 bg-bg-dark',
            className
          )}
        >
          {/* LCARS top decoration */}
          <div className="flex items-stretch gap-2 mb-6">
            <div className="w-8 h-16 bg-lcars-lavender rounded-bl-[2rem]" />
            <div className="flex-1 flex items-end">
              <div className="h-4 flex-1 bg-lcars-lavender rounded-r-full" />
            </div>
            <div className="w-32 h-4 bg-lcars-periwinkle rounded-l-full self-end" />
            <div className="w-24 h-4 bg-lcars-sky self-end" />
            <div className="w-16 h-4 bg-lcars-sage rounded-r-full self-end" />
          </div>

          <div className="max-w-7xl mx-auto">
            {children}
          </div>

          {/* LCARS bottom decoration */}
          <div className="flex items-stretch gap-2 mt-6">
            <div className="w-8 h-16 bg-lcars-periwinkle rounded-tl-[2rem]" />
            <div className="flex-1 flex items-start">
              <div className="h-4 flex-1 bg-lcars-periwinkle rounded-r-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
