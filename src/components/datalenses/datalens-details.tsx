import { DataLens } from "@/types/datalens"
import { Button } from "@/components/ui/button"

interface DataLensDetailsProps {
  dataLens: DataLens | undefined
  onOrganize: () => void
}

export function DataLensDetails({ dataLens, onOrganize }: DataLensDetailsProps) {
  if (!dataLens) {
    return null
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">DataLens Detail: {dataLens.datalens_name}</h1>
        <Button onClick={onOrganize}>Organize</Button>
      </div>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Data Source</h2>
          <p className="text-gray-600">{dataLens.datasource.datasource_name}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Configuration</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(dataLens.datalens_config, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 