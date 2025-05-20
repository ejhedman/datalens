'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataSource {
  id: string
  datasource_name: string
  datalens_config?: any
}

interface DataSourceListProps {
  databases: DataSource[]
  selectedDatabaseId: string | null
  onDatabaseSelect: (database: DataSource) => void
  onNewDatabase: () => void
}

export function DataSourceList({
  databases,
  selectedDatabaseId,
  onDatabaseSelect,
  onNewDatabase,
}: DataSourceListProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Data Sources</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewDatabase}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md border border-gray-300 hover:border-gray-400"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create New Data Source</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {databases.map((database) => (
              <div
                key={database.id}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedDatabaseId === database.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => onDatabaseSelect(database)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{database.datasource_name}</div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDatabaseSelect(database)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Data Source</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 