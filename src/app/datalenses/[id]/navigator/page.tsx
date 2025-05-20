'use client'

import { Suspense, useState, useEffect } from 'react';
import DataNavigator from '@/components/DataNavigator/DataNavigator';
import { loadTables } from '@/lib/config';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';

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
  const params = useParams();
  const supabase = createClientComponentClient();

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

  return (
    <div className="h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <DataNavigator config={config} title={dataLensName} />
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