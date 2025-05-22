'use client';

import { ChevronUp, ChevronDown, Filter, X } from 'lucide-react';

interface TableControlsProps {
  columnName: string;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  hasFilter: boolean;
  isActiveFilter: boolean;
  onSort: () => void;
  onFilter: () => void;
  onClearFilter: () => void;
}

export default function TableControls({
  columnName,
  sortField,
  sortDirection,
  hasFilter,
  isActiveFilter,
  onSort,
  onFilter,
  onClearFilter
}: TableControlsProps) {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs">{columnName}</span>
      <div className="flex items-center space-x-0.5">
        <button
          onClick={onSort}
          className="hover:text-gray-700"
        >
          {sortField === columnName ? (
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
          onClick={onFilter}
          className={`hover:text-gray-700 ${hasFilter ? 'text-blue-500' : ''}`}
        >
          <Filter size={12} />
        </button>
        {hasFilter && (
          <button
            onClick={onClearFilter}
            className="text-red-500 hover:text-red-700"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
} 