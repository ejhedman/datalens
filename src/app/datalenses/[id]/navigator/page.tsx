'use client'

import { Suspense, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import { DataNavigatorConfig, DataSource } from '@/types/datalens';
import DataNavigator from '@/components/DataNavigator/DataNavigator';
import { toast } from 'sonner';

interface DataLensResponse {
  datalens_name: string;
  datalens_config: DataNavigatorConfig;
  datasources: DataSource;
}

interface Table {
  name: string;
  type: 'table' | 'view';
  ordinal: number;
  active: boolean;
  key_column?: string;
  sort_column?: string;
  columns: Column[];
}

interface Column {
  name: string;
  dataType: string;
  ordinal: number;
  active: boolean;
  filterable?: boolean;
  sortable?: boolean;
  key_column?: boolean;
  sort_column?: boolean;
}

function validateConfig(config: any): { isValid: boolean; error?: string } {
  if (!config) {
    return { isValid: false, error: 'Configuration is undefined or null' };
  }

  // If config is an array, it's valid (it's the tables array)
  if (Array.isArray(config)) {
    return { isValid: true };
  }

  // If config is an object, check if it has a tables array
  if (!Array.isArray(config.tables)) {
    return { 
      isValid: false, 
      error: `Configuration tables is not an array. Type: ${typeof config.tables}, Value: ${JSON.stringify(config.tables)}` 
    };
  }

  for (const [index, table] of config.tables.entries()) {
    if (!table.name) {
      return { 
        isValid: false, 
        error: `Table at index ${index} is missing required 'name' property. Table data: ${JSON.stringify(table)}` 
      };
    }

    if (!Array.isArray(table.columns)) {
      return { 
        isValid: false, 
        error: `Table '${table.name}' columns is not an array. Type: ${typeof table.columns}, Value: ${JSON.stringify(table.columns)}` 
      };
    }

    for (const [colIndex, column] of table.columns.entries()) {
      if (!column.name) {
        return { 
          isValid: false, 
          error: `Table '${table.name}' column at index ${colIndex} is missing required 'name' property. Column data: ${JSON.stringify(column)}` 
        };
      }
    }
  }

  return { isValid: true };
}

function processConfig(rawConfig: any): DataNavigatorConfig {
  // Get the tables array, whether it's directly the config or in config.tables
  const tables = Array.isArray(rawConfig) ? rawConfig : rawConfig.tables || [];

  // Filter and process the tables
  const processedTables = tables
    .filter((table: Table) => table.active) // Only keep active tables
    .map((table: Table) => ({
      ...table,
      columns: table.columns
        .filter((column: Column) => column.active) // Only keep active columns
        .map((column: Column) => ({
          ...column,
          // Ensure required properties are present
          filterable: column.filterable ?? true,
          sortable: column.sortable ?? true,
          key_column: column.key_column ?? false,
          sort_column: column.sort_column ?? false
        }))
    }));

  return { tables: processedTables };
}

export default function DataNavigatorPage() {
  const [config, setConfig] = useState<DataNavigatorConfig>({ tables: [] });
  const [dataLensName, setDataLensName] = useState<string>('');
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchDataLensAndSource = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch the DataLens and its associated DataSource
        const { data: dataLens, error: lensError } = await supabase
          .from('datalenses')
          .select(`
            datalens_name,
            datalens_config,
            datasources (
              jdbc_url,
              username,
              password
            )
          `)
          .eq('id', params.id)
          .single();

        if (lensError) {
          throw new Error(`Failed to fetch DataLens: ${lensError.message}`);
        }

        if (!dataLens) {
          throw new Error('DataLens not found');
        }

        const response = dataLens as unknown as DataLensResponse;
        
        // Log the configuration for debugging
        console.log('Raw datalens_config:', response.datalens_config);
        
        // Validate the configuration
        const validation = validateConfig(response.datalens_config);
        if (!validation.isValid) {
          throw new Error(`Invalid DataLens configuration: ${validation.error}`);
        }

        // Process the configuration to filter out inactive tables and columns
        const processedConfig = processConfig(response.datalens_config);
        console.log('Processed config:', processedConfig);

        setDataLensName(response.datalens_name);
        setDataSource(response.datasources);
        setConfig(processedConfig);
      } catch (error) {
        console.error('Error fetching DataLens:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load DataLens';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataLensAndSource();
  }, [params.id, supabase, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading DataLens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading DataLens</h2>
          <p className="text-red-700 whitespace-pre-wrap">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <DataNavigator 
          config={config}
          title={dataLensName}
          dataSource={dataSource}
        />
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