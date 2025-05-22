'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Sidebar } from '@/components/layout/sidebar'
import { DataSourceList } from '@/components/datasources/datasource-list'
import { DataLensList } from '@/components/datalenses/datalens-list'
import { getCurrentDataSource } from '@/components/layout/datasource-selector'
import { DataLens } from '@/types/datalens'
import { usePathname } from 'next/navigation'

interface DataSource {
  id: string
  datasource_name: string
  type: string
  created_at: string
}

export default function AuthenticatedHome() {
  const [recentDataSources, setRecentDataSources] = useState<DataSource[]>([])
  const [recentDataLenses, setRecentDataLenses] = useState<DataLens[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDataSourceId, setCurrentDataSourceId] = useState<string | null>(getCurrentDataSource())
  const [selectedDataLensId, setSelectedDataLensId] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<'datasources' | 'datalenses' | null>(null)
  const supabase = createClientComponentClient()
  const pathname = usePathname()

  // Clear selected section when navigating away from home
  useEffect(() => {
    if (pathname !== '/') {
      setSelectedSection(null)
    }
  }, [pathname])

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        // Fetch recent data sources
        const { data: dataSources, error: dataSourcesError } = await supabase
          .from('datasources')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (dataSourcesError) throw dataSourcesError

        // Fetch recent data lenses
        const { data: dataLenses, error: dataLensesError } = await supabase
          .from('datalenses')
          .select(`
            *,
            datasources:datasource_id (
              datasource_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (dataLensesError) throw dataLensesError

        setRecentDataSources(dataSources || [])
        setRecentDataLenses(dataLenses || [])
      } catch (error) {
        console.error('Error fetching recent data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentData()
  }, [supabase])

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

  const handleDataLensSelect = (dataLens: DataLens) => {
    localStorage.setItem('selectedDataLensId', dataLens.id)
    setSelectedDataLensId(dataLens.id)
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-full">
      <Sidebar onSectionSelect={setSelectedSection} selectedSection={selectedSection} />
      <div className="flex-1 ml-16">
        <div className="flex h-full">
          <div className="w-64 bg-white border-r border-gray-200">
            {selectedSection === 'datasources' && (
              <DataSourceList
                databases={recentDataSources}
                selectedDatabaseId={currentDataSourceId}
                onDatabaseSelect={(db) => setCurrentDataSourceId(db.id)}
                onNewDatabase={() => {}}
              />
            )}
            {selectedSection === 'datalenses' && (
              <DataLensList
                dataLenses={recentDataLenses}
                selectedDataLensId={selectedDataLensId}
                onDataLensSelect={handleDataLensSelect}
                onNewDataLens={() => {}}
                isLoading={loading}
                isDataSourceSelected={!!currentDataSourceId}
              />
            )}
          </div>
          <main className="flex-1 p-6">
            <div className="space-y-12">
              {/* Recent Data Sources Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Data Sources</h2>
                  <button
                    onClick={() => setSelectedSection('datasources')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                {recentDataSources.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentDataSources.map((source) => (
                      <div
                        key={source.id}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{source.datasource_name}</h3>
                        <p className="text-sm text-gray-500">Type: {source.type}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(source.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">No data sources found</p>
                  </div>
                )}
              </section>

              {/* Recent Data Lenses Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Data Lenses</h2>
                  <button
                    onClick={() => setSelectedSection('datalenses')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                {recentDataLenses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentDataLenses.map((lens) => (
                      <div
                        key={lens.id}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{lens.datalens_name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {lens.datasource?.datasource_name || 'No data source'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">No data lenses found</p>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 