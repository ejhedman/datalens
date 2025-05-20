'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { testJdbcConnection } from '@/lib/jdbc'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { DataSourceList } from '@/components/datasources/datasource-list'
import DataLensOrganizer from '@/components/organizer/datalens-organizer'
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
import { Progress } from "@/components/ui/progress"
import { ReadDDLDialog } from '@/components/datalenses/read-ddl-dialog'
import { setCurrentDataSource } from '@/components/layout/datasource-selector'
import { CopyButton } from '@/components/ui/copy-button'
import { CopyJsonButton } from '@/components/ui/copy-json-button'

// Dynamically import ReactJsonView to avoid SSR issues
const ReactJsonView = dynamic(() => import('react-json-view'), { ssr: false })

interface DataSource {
  id: string
  datasource_name: string
  datalens_config?: any
}

interface DatabaseDetails {
  id: string
  user_id: string
  datasource_name: string
  jdbc_url: string
  username: string
  password: string
  datalens_config: any
  created_at: string
  ddl?: string
}

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

export default function DataSourcesPage() {
  const [databases, setDatabases] = useState<DatabaseDetails[]>([])
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null)
  const [organizingDatabase, setOrganizingDatabase] = useState<DatabaseDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    datasource_name: '',
    jdbc_url: '',
    db_username: '',
    db_password: '',
  })
  const [isReadingDDL, setIsReadingDDL] = useState(false)
  const [ddlProgress, setDdlProgress] = useState(0)
  const [isReadDDLOpen, setIsReadDDLOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDatabases = async () => {
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

        setDatabases(data || [])
      } catch (error: any) {
        toast.error('Error fetching data sources: ' + error.message)
      }
    }

    fetchDatabases()
  }, [supabase])

  const handleDatabaseSelect = (database: DataSource) => {
    setSelectedDatabaseId(database.id)
    setOrganizingDatabase(null)
  }

  const handleOrganize = (database: DataSource) => {
    const fullDatabase = databases.find(db => db.id === database.id)
    if (fullDatabase) {
      setOrganizingDatabase(fullDatabase)
    }
  }

  const handleSaveOrganize = async (schema: Table[]) => {
    if (!organizingDatabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase
        .from('datasources')
        .update({
          datalens_config: schema
        })
        .eq('id', organizingDatabase.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('DataLens saved successfully')
      setOrganizingDatabase(null)
      
      // Refresh the database list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      toast.error('Error saving schema: ' + error.message)
    }
  }

  const handleCancelOrganize = () => {
    setOrganizingDatabase(null)
  }

  const handleNewDatabase = () => {
    setIsCreating(true)
    setFormData({
      datasource_name: '',
      jdbc_url: '',
      db_username: '',
      db_password: '',
    })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase
        .from('datasources')
        .insert({
          datasource_name: formData.datasource_name,
          jdbc_url: formData.jdbc_url,
          username: formData.db_username,
          password: formData.db_password,
          user_id: session.user.id,
        })

      if (error) {
        throw error
      }

      toast.success('Data source created successfully')
      setIsCreating(false)
      
      // Refresh the database list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      toast.error('Error creating data source: ' + error.message)
    }
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
  }

  const handleEdit = (database: DatabaseDetails) => {
    setFormData({
      datasource_name: database.datasource_name,
      jdbc_url: database.jdbc_url,
      db_username: database.username,
      db_password: database.password,
    })
    setIsEditing(true)
  }

  const handleTestConnection = async () => {
    if (!formData.jdbc_url || !formData.db_username || !formData.db_password) {
      toast.error('Please fill in all connection details')
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/datasources/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jdbcUrl: formData.jdbc_url,
          username: formData.db_username,
          password: formData.db_password
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Connection successful!')
      } else {
        toast.error('Connection failed: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error testing connection: ' + error.message)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      if (!selectedDatabaseId) {
        throw new Error('No database selected')
      }

      const { error } = await supabase
        .from('datasources')
        .update({
          datasource_name: formData.datasource_name,
          jdbc_url: formData.jdbc_url,
          username: formData.db_username,
          password: formData.db_password,
        })
        .eq('id', selectedDatabaseId)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('Data source updated successfully')
      setIsEditing(false)
      
      // Refresh the database list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      toast.error('Error updating data source: ' + error.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (selectedDatabase) {
      setFormData({
        datasource_name: selectedDatabase.datasource_name,
        jdbc_url: selectedDatabase.jdbc_url,
        db_username: selectedDatabase.username,
        db_password: selectedDatabase.password,
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDelete = async () => {
    if (!selectedDatabaseId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase
        .from('datasources')
        .delete()
        .eq('id', selectedDatabaseId)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('Data source deleted successfully')
      setSelectedDatabaseId(null)
      
      // Refresh the database list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      toast.error('Error deleting data source: ' + error.message)
    }
  }

  const handleReadDDL = async () => {
    if (!selectedDatabase) return

    setIsReadingDDL(true)
    setDdlProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDdlProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/database-configs/read-ddl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasourceId: selectedDatabase.id,
          jdbcUrl: selectedDatabase.jdbc_url,
          username: selectedDatabase.username,
          password: selectedDatabase.password
        }),
      })

      clearInterval(progressInterval)
      setDdlProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to read DDL')
      }

      const { ddl } = await response.json()
      
      // Update the datasource with the DDL
      const { error } = await supabase
        .from('datasources')
        .update({
          ddl: ddl
        })
        .eq('id', selectedDatabase.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('DDL read successfully')
      
      // Refresh the database list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      toast.error('Error reading DDL: ' + error.message)
    } finally {
      setIsReadingDDL(false)
      setDdlProgress(0)
    }
  }

  const handleSaveDDL = async (schema: any) => {
    if (!selectedDatabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in')
        return
      }

      // Ensure schema is properly serialized
      const serializedSchema = JSON.parse(JSON.stringify(schema))

      const { error } = await supabase
        .from('datasources')
        .update({
          datalens_config: serializedSchema
        })
        .eq('id', selectedDatabase.id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      toast.success('Schema saved successfully')
      
      // Refresh the data source list
      const { data, error: fetchError } = await supabase
        .from('datasources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDatabases(data || [])
    } catch (error: any) {
      console.error('Error saving schema:', error)
      toast.error('Error saving schema: ' + error.message)
    }
  }

  const selectedDatabase = databases.find(db => db.id === selectedDatabaseId)

  return (
    <div className="flex h-full overflow-hidden">
      <DataSourceList
        databases={databases}
        selectedDatabaseId={selectedDatabaseId}
        onDatabaseSelect={handleDatabaseSelect}
        onNewDatabase={handleNewDatabase}
      />
      <div className="flex-1 overflow-y-auto">
        {organizingDatabase ? (
          <div className="p-6">
            <DataLensOrganizer
              initialSchema={(organizingDatabase.datalens_config || []) as Table[]}
              onSave={handleSaveOrganize}
              onCancel={handleCancelOrganize}
              title={`Configure Default DataLens: ${organizingDatabase.datasource_name}`}
            />
          </div>
        ) : isCreating ? (
          <div className="p-6">
            <form onSubmit={handleCreateSubmit} className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">New Data Source</h2>
              </div>

              <div>
                <Label htmlFor="datasource_name">Data Source Name</Label>
                <Input
                  id="datasource_name"
                  name="datasource_name"
                  value={formData.datasource_name}
                  onChange={handleInputChange}
                  placeholder="My Data Source"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jdbc_url">JDBC URL</Label>
                <Input
                  id="jdbc_url"
                  name="jdbc_url"
                  value={formData.jdbc_url}
                  onChange={handleInputChange}
                  placeholder="jdbc:postgresql://host:port/database"
                  required
                />
              </div>

              <div>
                <Label htmlFor="db_username">Database Username</Label>
                <Input
                  id="db_username"
                  name="db_username"
                  value={formData.db_username}
                  onChange={handleInputChange}
                  placeholder="username"
                  required
                />
              </div>

              <div>
                <Label htmlFor="db_password">Database Password</Label>
                <Input
                  id="db_password"
                  name="db_password"
                  type="password"
                  value={formData.db_password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
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
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelCreate}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : selectedDatabase ? (
          isEditing ? (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Edit Data Source</h2>
                </div>

                <div>
                  <Label htmlFor="datasource_name">Data Source Name</Label>
                  <Input
                    id="datasource_name"
                    name="datasource_name"
                    value={formData.datasource_name}
                    onChange={handleInputChange}
                    placeholder="My Data Source"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jdbc_url">JDBC URL</Label>
                  <Input
                    id="jdbc_url"
                    name="jdbc_url"
                    value={formData.jdbc_url}
                    onChange={handleInputChange}
                    placeholder="jdbc:postgresql://host:port/database"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="db_username">Database Username</Label>
                  <Input
                    id="db_username"
                    name="db_username"
                    value={formData.db_username}
                    onChange={handleInputChange}
                    placeholder="username"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="db_password">Database Password</Label>
                  <Input
                    id="db_password"
                    name="db_password"
                    type="password"
                    value={formData.db_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
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
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
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
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedDatabase.datasource_name}</h1>
                  <p className="text-gray-500 mt-1">Data Source Configuration</p>
                </div>
                <div className="flex gap-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Delete DataSource
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the data source
                          "{selectedDatabase.datasource_name}" and all associated data lenses.
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
              
              {isReadingDDL && (
                <div className="mb-6">
                  <Progress value={ddlProgress} className="w-full" />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Connection Details</h2>
                    <div className="flex gap-3">
                      <Button onClick={() => handleEdit(selectedDatabase)} variant="outline">
                        Edit Connection
                      </Button>
                      <Button
                        onClick={async () => {
                          setIsTesting(true)
                          try {
                            const response = await fetch('/api/datasources/test-connection', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                jdbcUrl: selectedDatabase.jdbc_url,
                                username: selectedDatabase.username,
                                password: selectedDatabase.password
                              }),
                            })

                            const result = await response.json()
                            if (result.success) {
                              toast.success('Connection successful!')
                            } else {
                              toast.error('Connection failed: ' + result.error)
                            }
                          } catch (error: any) {
                            toast.error('Error testing connection: ' + error.message)
                          } finally {
                            setIsTesting(false)
                          }
                        }}
                        variant="outline"
                        disabled={isTesting}
                        className="w-[140px]"
                      >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">JDBC URL</p>
                      <p className="mt-1 text-sm text-gray-900 break-all">{selectedDatabase.jdbc_url}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Username</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedDatabase.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Password</p>
                        <p className="mt-1 text-sm text-gray-900">••••••••</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedDatabase.ddl && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Database Schema (DDL)</h2>
                    </div>
                    <div className="p-6">
                      <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                        {selectedDatabase.ddl}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedDatabase.datalens_config && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">DataLens Configuration</h2>
                      <div className="flex gap-3">
                        <CopyButton data={selectedDatabase.datalens_config} />
                        <CopyJsonButton data={selectedDatabase.datalens_config} />
                        <Button
                          variant="outline"
                          onClick={() => setIsReadDDLOpen(true)}
                        >
                          Read Schema
                        </Button>
                        <Button onClick={() => handleOrganize(selectedDatabase)}>
                          Configure DataLens
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg overflow-auto">
                        <ReactJsonView
                          src={selectedDatabase.datalens_config}
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
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a data source to view details
          </div>
        )}
      </div>

      {selectedDatabase && (
        <ReadDDLDialog
          isOpen={isReadDDLOpen}
          onClose={() => setIsReadDDLOpen(false)}
          onSave={handleSaveDDL}
          jdbcUrl={selectedDatabase.jdbc_url}
          username={selectedDatabase.username}
          password={selectedDatabase.password}
        />
      )}
    </div>
  )
} 