'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import DataLensOrganizer from '@/components/organizer/datalens-organizer'

interface DataSource {
  id: string
  datasource_name: string
  datalens_config?: any
  user_id: string
  jdbc_url: string
  username: string
  password: string
  created_at: string
}

export default function OrganizePage() {
  const [datasource, setDatasource] = useState<DataSource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDatasource = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check:', { session, sessionError })
      
      if (!session) {
        console.log('No session found, redirecting to login')
        router.push('/login')
        return
      }

      const datasourceId = params?.id
      if (!datasourceId) {
        toast.error('No data source ID provided')
        router.push('/datasources')
        return
      }

      const { data, error } = await supabase
        .from('datasources')
        .select('*')
        .eq('id', datasourceId)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching data source:', error)
        toast.error('Error fetching data source: ' + error.message)
        router.push('/datasources')
        return
      }

      setDatasource(data)
      setIsLoading(false)
    }

    fetchDatasource()
  }, [params?.id, router, supabase])

  const handleSave = async (schema: any) => {
    if (!datasource) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('datasources')
        .update({
          datalens_config: schema
        })
        .eq('id', datasource.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('DataLens saved successfully')
      router.push('/datasources')
    } catch (error: any) {
      toast.error('Error saving schema: ' + error.message)
    }
  }

  const handleCancel = () => {
    router.push('/datasources')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!datasource) {
    return <div>Data source not found</div>
  }

  return (
    <DataLensOrganizer
      initialSchema={datasource.datalens_config || []}
      onSave={handleSave}
      onCancel={handleCancel}
      title={`Configure Default DataLens: ${datasource.datasource_name}`}
    />
  )
} 