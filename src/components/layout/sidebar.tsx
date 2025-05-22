'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Database,
  Aperture
} from 'lucide-react'

type Section = 'datasources' | 'datalenses' | null

const menuItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    section: null,
  },
  {
    name: 'DataSources',
    href: '/datasources',
    icon: Database,
    section: 'datasources' as Section,
  },
]

const profileItems = [
  {
    name: 'DataLenses',
    href: '/datalenses',
    icon: Aperture,
    section: 'datalenses' as Section,
  },
]

interface SidebarProps {
  onSectionSelect: (section: Section) => void
  selectedSection: Section
}

export function Sidebar({ onSectionSelect, selectedSection }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandTimeout, setExpandTimeout] = useState<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(true)
    }, 1000) // 1 second delay
    setExpandTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (expandTimeout) {
      clearTimeout(expandTimeout)
      setExpandTimeout(null)
    }
    setIsExpanded(false)
  }

  const handleSectionClick = (section: Section) => {
    onSectionSelect(section)
  }

  return (
    <div
      className={cn(
        'fixed h-full bg-gray-900 text-white transition-all duration-300 ease-in-out z-10',
        isExpanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* Menu Items */}
        <nav className="space-y-1 px-2 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
                onClick={() => handleSectionClick(item.section)}
              >
                <item.icon className={cn(
                  'h-6 w-6',
                  isActive ? 'text-white' : 'text-gray-400'
                )} />
                {isExpanded && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="px-2">
          <div className="h-px bg-gray-700" />
        </div>

        {/* DataLens Items */}
        <nav className="space-y-1 px-2 py-2">
          {profileItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
                onClick={() => handleSectionClick(item.section)}
              >
                <item.icon className={cn(
                  'h-6 w-6',
                  isActive ? 'text-white' : 'text-gray-400'
                )} />
                {isExpanded && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
} 