'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import DataTable from './DataTable';
import { DataNavigatorConfig } from '@/types/datalens';

interface DataNavigatorProps {
  config: DataNavigatorConfig;
  title?: string;
  dataSource?: any;
}

export default function DataNavigator({ config, title, dataSource }: DataNavigatorProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  // Ensure config.tables exists and is an array
  const tables = config?.tables || [];
  const selectedTableConfig = tables.find(t => t.name === selectedTable);

  // Convert table columns to DataTable column format
  const columns = selectedTableConfig?.columns?.map(col => ({
    name: col.name,
    type: col.dataType,
    ordinal: col.ordinal
  })) || [];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex flex-1 min-h-0">
        <Sidebar 
          selectedTable={selectedTable} 
          onTableSelect={setSelectedTable}
          tables={tables}
          title={title}
        />
        <main className="flex-1 p-4">
          <DataTable 
            table={selectedTable || undefined}
            columns={columns}
            dataSource={dataSource}
          />
        </main>
      </div>
      <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-4">
        <div className="text-sm text-gray-600">
          DataLens v1.0
        </div>
        <div className="text-sm text-gray-600">
          © 2024 DataLens
        </div>
      </footer>
    </div>
  );
} 