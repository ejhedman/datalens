'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataSource {
  id: string
  datasource_name: string
  database_type?: string
  created_at: string
}

// Keep track of the current data source in memory only
let currentDataSourceId: string | null = null

export function getCurrentDataSource(): string | null {
  return currentDataSourceId
}

export function setCurrentDataSource(id: string | null) {
  currentDataSourceId = id
  // Dispatch a custom event to notify other components
  window.dispatchEvent(new CustomEvent('dataSourceChange', { detail: id }))
}

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DataSourceSelector() {
  const [datasources, setDatasources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDatasources = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast.error('You must be logged in to view data sources')
          return
        }

        const { data, error } = await supabase
          .from('datasources')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Error fetching data sources: ' + error.message)
          return
        }

        setDatasources(data || [])
      } catch (error: any) {
        toast.error('Error fetching data sources: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDatasources()
  }, [supabase])

  const handleDatasourceSelect = (datasourceId: string) => {
    if (datasourceId === '') {
      setCurrentDataSource(null)
      setSelectedId(null)
    } else {
      setCurrentDataSource(datasourceId)
      setSelectedId(datasourceId)
      router.push('/datalenses')
    }
  }

  const handleNewDatasource = () => {
    router.push('/datasources')
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <select
          value={selectedId || ''}
          onChange={(e) => handleDatasourceSelect(e.target.value)}
          className="h-8 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a data source</option>
          {datasources.map((datasource) => (
            <option key={datasource.id} value={datasource.id}>
              {datasource.datasource_name}
            </option>
          ))}
        </select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewDatasource}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md border border-gray-300 hover:border-gray-400"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add New Data Source</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
} 