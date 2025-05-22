'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Filter, Loader2, X, Code } from 'lucide-react';
import { TableContainer, Table, Paper } from '@mui/material';
import SqlDialog from './SqlDialog';

interface Column {
  name: string;
  type: string;
  ordinal: number;
}

interface DataTableProps {
  table?: string;
  columns: Column[];
}

interface FilterDropdownProps {
  table: string;
  column: string;
  selectedValues: any[];
  onSelect: (values: any[]) => void;
  onClose: () => void;
  filters: Record<string, any[]>;
}

function FilterDropdown({ table, column, selectedValues, onSelect, onClose, filters }: FilterDropdownProps) {
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
          filters: JSON.stringify(filters)
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
  }, [table, column, search, filters]);

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

export default function DataTable({ table, columns: configuredColumns }: DataTableProps) {
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
      });

      // Only add lastKey if we're not resetting and we have a lastKey
      if (!reset && lastKey) {
        params.append('lastKey', lastKey);
      }

      console.log('Loading data with params:', {
        table,
        pageSize: '100',
        sortField: sortField || '',
        sortDirection: sortDirection || 'asc',
        filters: JSON.stringify(filters),
        lastKey: !reset ? lastKey : 'none',
        reset
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

  const getDistinctValues = (field: string) => {
    return Array.from(new Set(data?.data.map(row => row[field]) || []));
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

  const tableStyles = {
    table: {
      width: 'fit-content',
      minWidth: '100%',
      borderCollapse: 'collapse' as const,
      backgroundColor: 'white',
    },
    th: {
      padding: '8px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #ddd',
      backgroundColor: '#f8f9fa',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1,
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '8px',
      borderBottom: '1px solid #ddd',
      whiteSpace: 'nowrap' as const,
    },
    container: {
      position: 'relative' as const,
    },
    headerCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sortIcon: {
      cursor: 'pointer',
    },
    filterIcon: {
      cursor: 'pointer',
      color: '#6c757d',
    },
    activeFilter: {
      color: '#007bff',
    },
    loading: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    error: {
      color: 'red',
      padding: '20px',
      textAlign: 'center' as const,
    },
    breadcrumbs: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #ddd',
    },
    filterChip: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      margin: '4px',
      backgroundColor: '#e9ecef',
      borderRadius: '16px',
      fontSize: '14px',
    },
    removeFilter: {
      marginLeft: '4px',
      cursor: 'pointer',
      color: '#6c757d',
    },
    rowCount: {
      color: '#6c757d',
      fontSize: '14px',
    },
  };

  if (!table) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a table to view data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {data?.query && (
              <button
                onClick={() => setShowSqlDialog(true)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Show SQL"
              >
                <Code size={16} />
              </button>
            )}
            <div className="text-sm font-medium text-gray-700">
              {table}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {data?.data.length} of {totalCount} rows
          </div>
        </div>
        {Object.entries(filters).some(([_, values]) => values.length > 0) && (
          <div className="p-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([field, values]) => 
                  values.length > 0 && (
                    <div key={field} className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1">
                      <span className="text-sm font-medium text-blue-700">{field}:</span>
                      <div className="flex flex-wrap gap-1">
                        {values.map((value, index) => (
                          <span key={index} className="text-sm text-blue-600">
                            {value}{index < values.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleFilter(field, [])}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
        {sortField && (
          <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                <span className="text-sm text-gray-600">{sortField}</span>
                <span className="text-sm text-gray-500">
                  ({sortDirection === 'asc' ? 'ascending' : 'descending'})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <div className="w-full">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                {sortedColumns.map(column => (
                  <th
                    key={column.name}
                    className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">{column.name}</span>
                      <div className="flex items-center space-x-0.5">
                        <button
                          onClick={() => handleSort(column.name)}
                          className="hover:text-gray-700"
                        >
                          {sortField === column.name ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )
                          ) : (
                            <ChevronUp size={12} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setActiveFilter(activeFilter === column.name ? null : column.name)}
                          className={`hover:text-gray-700 ${
                            filters[column.name]?.length ? 'text-blue-500' : ''
                          }`}
                        >
                          <Filter size={12} />
                        </button>
                        {filters[column.name]?.length > 0 && (
                          <button
                            onClick={() => handleFilter(column.name, [])}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    {activeFilter === column.name && (
                      <FilterDropdown
                        table={table}
                        column={column.name}
                        selectedValues={filters[column.name] || []}
                        onSelect={(values) => handleFilter(column.name, values)}
                        onClose={() => setActiveFilter(null)}
                        filters={filters}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map((row, index) => (
                <tr
                  key={index}
                  ref={index === data.data.length - 1 ? lastRowRef : undefined}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  {sortedColumns.map(column => (
                    <td 
                      key={column.name} 
                      className="px-2 py-1 whitespace-nowrap hover:bg-gray-100 cursor-pointer"
                      onDoubleClick={() => {
                        const value = row[column.name];
                        if (value !== null && value !== undefined) {
                          handleFilter(column.name, [value]);
                        }
                      }}
                    >
                      {row[column.name]}
                    </td>
                  ))}
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={sortedColumns.length} className="px-2 py-1 text-center">
                    <Loader2 className="animate-spin mx-auto h-4 w-4" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="h-16"></div>
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