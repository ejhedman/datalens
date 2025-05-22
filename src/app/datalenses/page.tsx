'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { getCurrentDataSource } from '@/components/layout/datasource-selector'
import { DataLensList } from '@/components/datalenses/datalens-list'
import { DataLens } from '@/types/datalens'
import { Button } from '@/components/ui/button'
import DataLensOrganizer from '@/components/organizer/datalens-organizer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import dynamic from 'next/dynamic'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CopyButton } from '@/components/ui/copy-button'
import { CopyJsonButton } from '@/components/ui/copy-json-button'

// Dynamically import ReactJsonView to avoid SSR issues
const ReactJsonView = dynamic(() => import('react-json-view'), { ssr: false })

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

export default function DataLensesPage() {
  const [currentDataSourceId, setCurrentDataSourceId] = useState<string | null>(getCurrentDataSource())
  const [selectedDataLensId, setSelectedDataLensId] = useState<string | null>(null)
  const [dataLenses, setDataLenses] = useState<DataLens[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [organizingLens, setOrganizingLens] = useState<DataLens | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    datalens_name: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [newFormData, setNewFormData] = useState({
    datalens_name: '',
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Initialize selectedDataLensId from localStorage after mount
  useEffect(() => {
    const storedLensId = localStorage.getItem('selectedDataLensId')
    if (storedLensId) {
      setSelectedDataLensId(storedLensId)
    }
  }, [])

  // Listen for data source changes
  useEffect(() => {
    const handleDataSourceChange = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>
      setCurrentDataSourceId(customEvent.detail)
      // Clear the selected lens when data source changes
      setSelectedDataLensId(null)
      localStorage.removeItem('selectedDataLensId')
    }

    window.addEventListener('dataSourceChange', handleDataSourceChange)
    return () => window.removeEventListener('dataSourceChange', handleDataSourceChange)
  }, [])

  // Fetch data lenses when data source changes
  useEffect(() => {
    if (!currentDataSourceId) {
      setDataLenses([])
      return
    }

    const fetchDataLenses = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast.error('You must be logged in to view data lenses')
          return
        }

        const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch data lenses')
        }

        const { lenses } = await response.json()
        setDataLenses(lenses || [])
      } catch (error: any) {
        toast.error('Error fetching data lenses: ' + error.message)
        console.error('Error fetching data lenses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDataLenses()
  }, [currentDataSourceId, supabase])

  const handleDataLensSelect = (dataLens: DataLens) => {
    localStorage.setItem('selectedDataLensId', dataLens.id)
    setSelectedDataLensId(dataLens.id)
    setOrganizingLens(null)
  }

  const handleNewDataLens = () => {
    setIsCreating(true)
    setNewFormData({ datalens_name: '' })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      // First, get the default configuration from the datasource
      const { data: datasource, error: dsError } = await supabase
        .from('datasources')
        .select('datalens_config')
        .eq('id', currentDataSourceId)
        .single()

      if (dsError) {
        throw dsError
      }

      // Create a new data lens with the default configuration
      const { data: newDataLens, error: lensError } = await supabase
        .from('datalenses')
        .insert({
          datasource_id: currentDataSourceId,
          datalens_name: newFormData.datalens_name,
          datalens_config: datasource?.datalens_config || {
            tables: [],
            views: [],
            storedProcedures: []
          }
        })
        .select()
        .single()

      if (lensError) {
        throw lensError
      }

      toast.success('DataLens created successfully')
      setIsCreating(false)
      setNewFormData({ datalens_name: '' })
      
      // Refresh the data lens list
      const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch data lenses')
      }
      const { lenses } = await response.json()
      setDataLenses(lenses || [])

      // Select the new data lens
      setSelectedDataLensId(newDataLens.id)
      localStorage.setItem('selectedDataLensId', newDataLens.id)
    } catch (error: any) {
      toast.error('Error creating new data lens: ' + error.message)
    }
  }

  const handleCreateCancel = () => {
    setIsCreating(false)
    setNewFormData({ datalens_name: '' })
  }

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFormData({ ...newFormData, [e.target.name]: e.target.value })
  }

  const handleOrganize = (dataLens: DataLens) => {
    setOrganizingLens(dataLens)
  }

  const handleSaveOrganize = async (schema: Table[]) => {
    if (!organizingLens) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase
        .from('datalenses')
        .update({
          datalens_config: schema
        })
        .eq('id', organizingLens.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('DataLens saved successfully')
      setOrganizingLens(null)
      
      // Refresh the data lens list
      const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch data lenses')
      }
      const { lenses } = await response.json()
      setDataLenses(lenses || [])
    } catch (error: any) {
      toast.error('Error saving schema: ' + error.message)
    }
  }

  const handleCancelOrganize = () => {
    setOrganizingLens(null)
  }

  const handleEdit = (dataLens: DataLens) => {
    setFormData({
      datalens_name: dataLens.datalens_name,
    })
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      if (!selectedDataLensId) {
        throw new Error('No data lens selected')
      }

      const { error } = await supabase
        .from('datalenses')
        .update({
          datalens_name: formData.datalens_name,
        })
        .eq('id', selectedDataLensId)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('Data lens updated successfully')
      setIsEditing(false)
      
      // Refresh the data lens list
      const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch data lenses')
      }
      const { lenses } = await response.json()
      setDataLenses(lenses || [])
    } catch (error: any) {
      toast.error('Error updating data lens: ' + error.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (selectedDataLens) {
      setFormData({
        datalens_name: selectedDataLens.datalens_name,
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDelete = async () => {
    if (!selectedDataLensId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase
        .from('datalenses')
        .delete()
        .eq('id', selectedDataLensId)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('Data lens deleted successfully')
      setSelectedDataLensId(null)
      localStorage.removeItem('selectedDataLensId')
      
      // Refresh the data lens list
      const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch data lenses')
      }
      const { lenses } = await response.json()
      setDataLenses(lenses || [])
    } catch (error: any) {
      toast.error('Error deleting data lens: ' + error.message)
    }
  }

  const handleResetDataLens = async () => {
    if (!selectedDataLens) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      // First, get the default configuration from the database
      const { data: database, error: dbError } = await supabase
        .from('datasources')
        .select('datalens_config')
        .eq('id', selectedDataLens.datasource_id)
        .single()

      if (dbError) {
        throw dbError
      }

      if (!database.datalens_config) {
        toast.error('No default configuration found in the database')
        return
      }

      // Update the datalens with the default configuration
      const { error: updateError } = await supabase
        .from('datalenses')
        .update({
          datalens_config: database.datalens_config
        })
        .eq('id', selectedDataLens.id)
        .eq('user_id', session.user.id)

      if (updateError) {
        throw updateError
      }

      toast.success('DataLens configuration reset successfully')
      
      // Refresh the data lens list
      const response = await fetch(`/api/datalenses?datasourceId=${currentDataSourceId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch data lenses')
      }
      const { lenses } = await response.json()
      setDataLenses(lenses || [])
    } catch (error: any) {
      toast.error('Error resetting DataLens: ' + error.message)
    }
  }

  const selectedDataLens = dataLenses.find(lens => lens.id === selectedDataLensId)

  return (
    <div className="flex h-full overflow-hidden">
      <DataLensList
        dataLenses={dataLenses}
        selectedDataLensId={selectedDataLensId}
        onDataLensSelect={handleDataLensSelect}
        onNewDataLens={handleNewDataLens}
        onOrganize={handleOrganize}
        isLoading={isLoading}
        isDataSourceSelected={!!currentDataSourceId}
      />
      <div className="flex-1 overflow-y-auto">
        {organizingLens ? (
          <div className="p-6">
            <DataLensOrganizer
              initialSchema={(organizingLens.datalens_config || []) as Table[]}
              onSave={handleSaveOrganize}
              onCancel={handleCancelOrganize}
              title={`Configure DataLens: ${organizingLens.datalens_name}`}
            />
          </div>
        ) : isCreating ? (
          <div className="p-6">
            <form onSubmit={handleCreateSubmit} className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Create New DataLens</h2>
              </div>

              <div>
                <Label htmlFor="datalens_name">DataLens Name</Label>
                <Input
                  id="datalens_name"
                  name="datalens_name"
                  value={newFormData.datalens_name}
                  onChange={handleNewInputChange}
                  placeholder="My DataLens"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : isEditing ? (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Edit DataLens</h2>
              </div>

              <div>
                <Label htmlFor="datalens_name">DataLens Name</Label>
                <Input
                  id="datalens_name"
                  name="datalens_name"
                  value={formData.datalens_name}
                  onChange={handleInputChange}
                  placeholder="My DataLens"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit">
                  Update
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : selectedDataLens ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedDataLens.datalens_name}</h1>
                <p className="text-gray-500 mt-1">DataLens Configuration</p>
              </div>
              <div className="flex gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Delete DataLens
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the data lens
                        "{selectedDataLens.datalens_name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">DataLens</h2>
                  <Button onClick={() => handleEdit(selectedDataLens)} variant="outline">
                    Edit
                  </Button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">DataLens Name</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedDataLens.datalens_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data Source</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedDataLens.datasource.datasource_name}</p>
                  </div>
                </div>
              </div>

              {selectedDataLens.datalens_config && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
                    <div className="flex gap-3">
                      <CopyButton data={selectedDataLens.datalens_config} />
                      <CopyJsonButton data={selectedDataLens.datalens_config} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                          >
                            Reset DataLens
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset DataLens Configuration?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will overwrite the current DataLens configuration with the default configuration from the database. All customizations will be lost.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetDataLens}>
                              Reset
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button onClick={() => handleOrganize(selectedDataLens)}>
                        Configure DataLens
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-lg overflow-auto">
                      <ReactJsonView
                        src={selectedDataLens.datalens_config}
                        theme="rjv-default"
                        name={false}
                        collapsed={false}
                        enableClipboard={false}
                        displayDataTypes={false}
                        style={{ fontSize: '14px' }}
                        groupArraysAfterLength={0}
                        shouldCollapse={(field) => {
                          if (Array.isArray(field.src)) {
                            return field.namespace.length > 1;
                          }
                          return false;
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a data lens to view details
          </div>
        )}
      </div>
    </div>
  )
} 