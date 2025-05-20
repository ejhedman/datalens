'use client'

import { Sidebar } from '@/components/layout/sidebar'

export default function DatabaseLensesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 ml-16">
        {children}
      </main>
    </div>
  )
} 