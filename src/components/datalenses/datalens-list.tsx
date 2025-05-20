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
import { DataLens } from '@/types/datalens'

interface DataLensListProps {
  dataLenses: DataLens[]
  selectedDataLensId: string | null
  onDataLensSelect: (dataLens: DataLens) => void
  onNewDataLens: () => void
  onOrganize?: (dataLens: DataLens) => void
  isLoading?: boolean
  isDataSourceSelected?: boolean
}

export function DataLensList({
  dataLenses = [],
  selectedDataLensId,
  onDataLensSelect,
  onNewDataLens,
  onOrganize,
  isLoading = false,
  isDataSourceSelected = true,
}: DataLensListProps) {
  const router = useRouter()

  const handleNameClick = (dataLens: DataLens) => {
    router.push(`/datalenses/${dataLens.id}/navigator`)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">DataLenses</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewDataLens}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md border border-gray-300 hover:border-gray-400"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create New DataLens</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Loading data lenses...</div>
        ) : !isDataSourceSelected ? (
          <div className="text-sm text-gray-500">Select a data source to view data lenses</div>
        ) : (
          <div className="space-y-2">
            {dataLenses.map((dataLens) => (
              <div
                key={dataLens.id}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedDataLensId === dataLens.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleNameClick(dataLens)}
                  >
                    {dataLens.datalens_name}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDataLensSelect(dataLens)
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit DataLens</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 