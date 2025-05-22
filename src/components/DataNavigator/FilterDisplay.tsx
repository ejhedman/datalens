'use client';

import { X } from 'lucide-react';

interface FilterDisplayProps {
  filters: Record<string, any[]>;
  onRemoveFilter: (field: string) => void;
}

export default function FilterDisplay({ filters, onRemoveFilter }: FilterDisplayProps) {
  if (!Object.entries(filters).some(([_, values]) => values.length > 0)) {
    return null;
  }

  return (
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
                  onClick={() => onRemoveFilter(field)}
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
  );
} 