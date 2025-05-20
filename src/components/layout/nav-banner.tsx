'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { DataSourceSelector } from './datasource-selector'

export function NavBanner() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      // Clear any stored data source selection
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentDataSourceId')
        window.dispatchEvent(new CustomEvent('dataSourceChange', { detail: null }))
      }

      // Sign out and clear session
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Navigate to home page
      router.push('/')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Still try to navigate to home page even if there's an error
      router.push('/')
    }
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/dwh_logo.png"
              alt="DWH Logo"
              width={200}
              height={400}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          {!loading && user && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <DataSourceSelector />
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 rounded-full">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 px-3 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="flex flex-col items-start p-2">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
} 