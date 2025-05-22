'use client'

import { Suspense, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import TableList from '@/components/DataNavigator/TableList';
import DataTable from '@/components/DataNavigator/DataTable';
import Breadcrumbs from '@/components/DataNavigator/Breadcrumbs';
import { loadTables } from '@/lib/config';

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

export default function DataNavigatorPage() {
  const [config, setConfig] = useState<DataNavigatorConfig>({ tables: [] });
  const [dataLensName, setDataLensName] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [tableSorts, setTableSorts] = useState<Record<string, { field: string | null; direction: 'asc' | 'desc' }>>({});
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const params = useParams();
  const supabase = createClientComponentClient();

  const selectedTableConfig = config.tables.find(t => t.name === selectedTable);
  const columns = selectedTableConfig?.columns.map(col => ({
    name: col.name,
    type: col.dataType,
    ordinal: col.ordinal
  })) || [];

  const currentSort = selectedTable ? tableSorts[selectedTable] : { field: null, direction: 'asc' as const };

  useEffect(() => {
    const fetchDataLens = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: dataLens, error } = await supabase
          .from('datalenses')
          .select('datalens_name')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (dataLens) {
          setDataLensName(dataLens.datalens_name);
        }
      } catch (error) {
        console.error('Error fetching DataLens:', error);
      }
    };

    fetchDataLens();
    loadTables().then(loadedTables => {
      setConfig({ tables: loadedTables });
    });
  }, [params.id, supabase]);

  const handleFilter = (field: string, values: any[]) => {
    setFilters(prev => ({
      ...prev,
      [field]: values,
    }));
  };

  return (
    <div className="h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col h-full bg-gray-100">
          <div className="flex flex-1 min-h-0">
            <TableList 
              selectedTable={selectedTable} 
              onTableSelect={setSelectedTable}
              tables={config.tables}
              title={dataLensName}
            />
            <main className="flex-1 p-4">
              <div className="flex flex-col h-full">
                <Breadcrumbs
                  table={selectedTable || undefined}
                  filters={filters}
                  sortField={currentSort?.field}
                  sortDirection={currentSort?.direction}
                  onFilter={handleFilter}
                  onShowSql={() => setShowSqlDialog(true)}
                />
                <DataTable 
                  table={selectedTable || undefined}
                  columns={columns}
                />
              </div>
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
      </Suspense>
    </div>
  );
}


// export default function DataNavigatorPage() {
//   return (
//     <div className="flex items-center justify-center h-full">
//       <h1 className="text-2xl font-bold">Data Navigator</h1>
//     </div>
//   )
// } 