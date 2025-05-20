'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import DataTable from './DataTable';

interface Table {
  name: string;
  ordinal: number;
  active: boolean;
  columns: Array<{
    name: string;
    dataType: string;
    ordinal: number;
    active: boolean;
    filterable: boolean;
    sortable: boolean;
  }>;
}

interface DataNavigatorConfig {
  tables: Table[];
}

interface DataNavigatorProps {
  config: DataNavigatorConfig;
  title?: string;
}

export default function DataNavigator({ config, title }: DataNavigatorProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const selectedTableConfig = config.tables.find(t => t.name === selectedTable);

  // Convert table columns to DataTable column format
  const columns = selectedTableConfig?.columns.map(col => ({
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
          tables={config.tables}
          title={title}
        />
        <main className="flex-1 overflow-hidden p-4">
          <DataTable 
            table={selectedTable || undefined}
            columns={columns}
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