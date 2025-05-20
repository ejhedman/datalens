import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface FilterDropdownProps {
  column: string;
  table: string;
  onSelect: (value: string) => void;
  currentFilters: Record<string, string>;
}

export default function FilterDropdown({ 
  column, 
  table, 
  onSelect,
  currentFilters 
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValues = async () => {
      if (!searchTerm) {
        setValues([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching distinct values:', {
          table,
          column,
          searchTerm,
          currentFilters,
        });

        const response = await fetch(
          `/api/distinct-values?table=${encodeURIComponent(table)}&column=${encodeURIComponent(column)}&search=${encodeURIComponent(searchTerm)}&filters=${encodeURIComponent(JSON.stringify(currentFilters))}`
        );

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch values');
        }

        setValues(data.values || []);
      } catch (err) {
        console.error('Error fetching values:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch values');
        setValues([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchValues, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, column, table, currentFilters]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
      >
        <span>Filter</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search values..."
                className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-2 flex justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : values.length > 0 ? (
              <div className="mt-2 max-h-60 overflow-y-auto">
                {values.map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      onSelect(value);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="mt-2 text-sm text-gray-500 text-center">
                No values found
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
} 