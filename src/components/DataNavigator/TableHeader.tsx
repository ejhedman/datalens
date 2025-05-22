'use client';

import { Code, Download } from 'lucide-react';

interface TableHeaderProps {
  table: string;
  rowCount: number;
  totalCount: number;
  hasData: boolean;
  onShowSql: () => void;
  onExportCsv: () => void;
  hasQuery?: boolean;
}

export default function TableHeader({
  table,
  rowCount,
  totalCount,
  hasData,
  onShowSql,
  onExportCsv,
  hasQuery = false
}: TableHeaderProps) {
  return (
    <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {hasQuery && (
          <button
            onClick={onShowSql}
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
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          {rowCount} of {totalCount} rows
        </div>
        {hasData && (
          <button
            onClick={onExportCsv}
            className="p-1 hover:bg-gray-200 rounded"
            title="Export to CSV"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
} 