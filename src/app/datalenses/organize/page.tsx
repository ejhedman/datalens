'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import DataLensOrganizer from '@/components/organizer/datalens-organizer'
import { DataLens } from '@/types/datalens'

interface Table {
  name: string
  type: 'table' | 'view'
  ordinal: number
  active: boolean
  columns: Array<{
    name: string
    dataType: string
    ordinal: number
    active: boolean
    filterable?: boolean
    sortable?: boolean
  }>
}

export default function OrganizePage() {
  const [dataLens, setDataLens] = useState<DataLens | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDataLens = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const lensId = searchParams.get('lensId')
      if (!lensId) {
        toast.error('No data lens ID provided')
        router.push('/datalenses')
        return
      }

      const { data, error } = await supabase
        .from('datalenses')
        .select('*, datasource:datasources(*)')
        .eq('id', lensId)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching data lens:', error)
        toast.error('Error fetching data lens: ' + error.message)
        router.push('/datalenses')
        return
      }

      setDataLens(data)
      setIsLoading(false)
    }

    fetchDataLens()
  }, [searchParams, router, supabase])

  const handleSave = async (schema: Table[]) => {
    if (!dataLens) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('datalenses')
        .update({
          datalens_config: schema
        })
        .eq('id', dataLens.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('DataLens saved successfully')
      router.push('/datalenses')
    } catch (error: any) {
      toast.error('Error saving schema: ' + error.message)
    }
  }

  const handleCancel = () => {
    router.push('/datalenses')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!dataLens) {
    return <div>Data lens not found</div>
  }

  return (
    <DataLensOrganizer
      initialSchema={dataLens.datalens_config as Table[] || []}
      onSave={handleSave}
      onCancel={handleCancel}
      title={`Configure DataLens: ${dataLens.datalens_name}`}
    />
  )
} 