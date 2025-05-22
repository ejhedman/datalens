'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import SqlDialog from './SqlDialog';
import TableHeader from './TableHeader';
import FilterDisplay from './FilterDisplay';
import SortDisplay from './SortDisplay';
import TableControls from './TableControls';
import TableRow from './TableRow';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

interface Column {
  name: string;
  type: string;
  ordinal: number;
}

interface DataTableProps {
  table?: string;
  columns: Array<{
    name: string;
    type: string;
    ordinal: number;
  }>;
  dataSource?: {
    jdbc_url: string;
    username: string;
    password: string;
  } | null;
  datalensId: string;
}

interface FilterDropdownProps {
  table: string;
  column: string;
  selectedValues: any[];
  onSelect: (values: any[]) => void;
  onClose: () => void;
  filters: Record<string, any[]>;
  datalensId: string;
}

function FilterDropdown({ table, column, selectedValues, onSelect, onClose, filters, datalensId }: FilterDropdownProps) {
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Fetch distinct values when search changes
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_BASE_URL 
          : 'http://localhost:3000';

        const params = new URLSearchParams({
          table,
          column,
          searchTerm: search,
          filters: JSON.stringify(filters),
          datalensId,
        });

        const response = await fetch(`${baseUrl}/api/distinct-values?${params}`);
        const result = await response.json();

        if (response.ok) {
          setValues(result);
        } else {
          console.error('Error fetching distinct values:', result.error);
        }
      } catch (error) {
        console.error('Error fetching distinct values:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [table, column, search, filters, datalensId]);

  const toggleValue = (value: any) => {
    if (selectedValues.includes(value)) {
      onSelect(selectedValues.filter(v => v !== value));
    } else {
      onSelect([...selectedValues, value]);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-10 mt-2 w-64 bg-white rounded-md shadow-lg"
    >
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-1 border rounded"
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="p-2 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : (
          values.map((value) => (
            <label key={value} className="flex items-center p-2 hover:bg-gray-100">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => toggleValue(value)}
                className="mr-2"
              />
              <span className="text-sm">{String(value)}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

interface DataResponse {
  data: any[];
  hasMore: boolean;
  lastKey: string | null;
  totalCount: number;
  query?: {
    sql: string;
    params: any[];
  };
}

export default function DataTable({ table, columns: configuredColumns, dataSource, datalensId }: DataTableProps) {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [tableSorts, setTableSorts] = useState<Record<string, { field: string | null; direction: 'asc' | 'desc' }>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [showSubstituted, setShowSubstituted] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useCallback((node: HTMLTableRowElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreData();
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Sort columns by ordinal
  const sortedColumns = [...configuredColumns].sort((a, b) => a.ordinal - b.ordinal);

  // Get current table's sort state
  const currentSort = table ? tableSorts[table] : { field: null, direction: 'asc' as const };
  const sortField = currentSort?.field;
  const sortDirection = currentSort?.direction || 'asc';

  // Set initial sort field when columns change
  useEffect(() => {
    if (table && configuredColumns.length > 0 && !currentSort?.field) {
      setTableSorts(prev => ({
        ...prev,
        [table]: { field: configuredColumns[0].name, direction: 'asc' }
      }));
    }
  }, [table, configuredColumns, currentSort]);

  useEffect(() => {
    console.log('Table or filters changed, resetting state');
    setData(null);
    setLastKey(null);
    setHasMore(true);
    setError(null);
    loadData(true);
  }, [table, filters, sortField, sortDirection]);

  const loadData = async (reset = true) => {
    if (!table) return;
    
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL 
        : 'http://localhost:3000';

      const params = new URLSearchParams({
        table,
        pageSize: '100',
        sortField: sortField || '',
        sortDirection: sortDirection || 'asc',
        filters: JSON.stringify(filters),
        datalensId,
      });

      if (!reset && lastKey) {
        params.append('lastKey', lastKey);
      }

      if (dataSource) {
        params.append('dataSource', JSON.stringify(dataSource));
      }

      console.log('Loading data with params:', {
        table,
        pageSize: '100',
        sortField: sortField || '',
        sortDirection: sortDirection || 'asc',
        filters: JSON.stringify(filters),
        lastKey: !reset ? lastKey : 'none',
        reset,
        hasDataSource: !!dataSource,
        datalensId,
      });

      const response = await fetch(`${baseUrl}/api/data?${params}`);
      const result = await response.json();

      if (response.ok) {
        if (reset) {
          setData(result);
        } else {
          setData(prev => ({
            ...result,
            data: [...(prev?.data || []), ...result.data]
          }));
        }
        setLastKey(result.lastKey);
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = () => {
    console.log('Attempting to load more data:', {
      loading,
      hasMore,
      lastKey,
      currentDataCount: data?.data?.length || 0
    });
    
    if (!loading && hasMore && lastKey) {
      loadData(false);
    }
  };

  const handleSort = (field: string) => {
    if (!table) return;
    
    setTableSorts(prev => {
      const currentTableSort = prev[table] || { field: null, direction: 'asc' };
      if (currentTableSort.field === field) {
        return {
          ...prev,
          [table]: {
            field,
            direction: currentTableSort.direction === 'asc' ? 'desc' : 'asc'
          }
        };
      } else {
        return {
          ...prev,
          [table]: {
            field,
            direction: 'asc'
          }
        };
      }
    });
  };

  const handleFilter = (field: string, values: any[]) => {
    setFilters(prev => ({
      ...prev,
      [field]: values,
    }));
    setActiveFilter(null);
  };

  const handleCopySql = () => {
    if (!data?.query) return;
    const textToCopy = showSubstituted ? substituteParams(data.query.sql, data.query.params) : data.query.sql;
    navigator.clipboard.writeText(textToCopy);
    setShowSqlDialog(false);
  };

  const substituteParams = (query: string, params: any[]): string => {
    let result = query;
    params.forEach((param, index) => {
      const value = typeof param === 'string' ? `'${param}'` : param;
      result = result.replace(`$${index + 1}`, value);
    });
    return result;
  };

  const handleExportCsv = () => {
    if (!data?.data || !sortedColumns) return;

    const headers = sortedColumns.map(col => col.name);
    const csvContent = [
      headers.join(','),
      ...data.data.map(row => 
        sortedColumns.map(col => {
          const value = row[col.name];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${table}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!table) {
    return <EmptyState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <TableHeader
          table={table}
          rowCount={data?.data.length || 0}
          totalCount={totalCount}
          hasData={!!data?.data.length}
          onShowSql={() => setShowSqlDialog(true)}
          onExportCsv={handleExportCsv}
          hasQuery={!!data?.query}
        />
        <FilterDisplay
          filters={filters}
          onRemoveFilter={(field) => handleFilter(field, [])}
        />
        <SortDisplay
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-auto">
          <div className="min-w-full inline-block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  {sortedColumns.map(column => (
                    <th
                      key={column.name}
                      className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0"
                    >
                      <TableControls
                        columnName={column.name}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        hasFilter={!!filters[column.name]?.length}
                        isActiveFilter={activeFilter === column.name}
                        onSort={() => handleSort(column.name)}
                        onFilter={() => setActiveFilter(activeFilter === column.name ? null : column.name)}
                        onClearFilter={() => handleFilter(column.name, [])}
                      />
                      {activeFilter === column.name && (
                        <FilterDropdown
                          table={table}
                          column={column.name}
                          selectedValues={filters[column.name] || []}
                          onSelect={(values) => handleFilter(column.name, values)}
                          onClose={() => setActiveFilter(null)}
                          filters={filters}
                          datalensId={datalensId}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data.map((row, index) => (
                  <TableRow
                    key={index}
                    row={row}
                    columns={sortedColumns}
                    index={index}
                    isLastRow={index === data.data.length - 1}
                    onRowRef={lastRowRef}
                    onCellDoubleClick={(columnName, value) => handleFilter(columnName, [value])}
                  />
                ))}
                {loading && <LoadingState columnCount={sortedColumns.length} />}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SqlDialog
        open={showSqlDialog}
        onClose={() => setShowSqlDialog(false)}
        sql={data?.query?.sql}
        params={data?.query?.params}
        showSubstituted={showSubstituted}
        onToggleSubstituted={() => setShowSubstituted(!showSubstituted)}
      />
    </div>
  );
} 