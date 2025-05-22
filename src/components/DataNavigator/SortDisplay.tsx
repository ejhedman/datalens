'use client';

interface SortDisplayProps {
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
}

export default function SortDisplay({ sortField, sortDirection }: SortDisplayProps) {
  if (!sortField) {
    return null;
  }

  return (
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
  );
} 