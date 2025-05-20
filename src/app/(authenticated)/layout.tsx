import { Sidebar } from '@/components/layout/sidebar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 pl-16 pt-16">
        {children}
      </main>
    </div>
  )
} 