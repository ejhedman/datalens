import { Sidebar } from '@/components/layout/sidebar'

export default function DatabaseConfigsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 pl-16">
        {children}
      </div>
    </div>
  )
} 