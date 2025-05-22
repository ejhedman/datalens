import { Code, X } from 'lucide-react';

interface BreadcrumbsProps {
  table?: string;
  dataLength?: number;
  totalCount?: number;
  filters: Record<string, any[]>;
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onFilter: (field: string, values: any[]) => void;
  onShowSql?: () => void;
  hasQuery?: boolean;
}

export default function Breadcrumbs({
  table,
  dataLength,
  totalCount,
  filters,
  sortField,
  sortDirection,
  onFilter,
  onShowSql,
  hasQuery
}: BreadcrumbsProps) {
  return (
    <div className="flex-none">
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
                      onClick={() => onFilter(field, [])}
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
  );
} 