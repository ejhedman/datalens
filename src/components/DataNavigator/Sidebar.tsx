'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface Table {
  name: string;
  ordinal: number;
  active: boolean;
}

interface SidebarProps {
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
  tables: Table[];
  title?: string;
}

export default function Sidebar({ selectedTable, onTableSelect, tables, title = 'Tables/Views' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!isCollapsed && <h2 className="text-lg font-semibold">{title}</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="p-2">
        <Link
          href="/"
          className="flex items-center w-full p-2 text-left rounded-md hover:bg-gray-100 mb-2"
        >
          <Home size={20} className="mr-2" />
          {!isCollapsed && "Home"}
        </Link>
        {tables.map((table) => (
          <button
            key={table.name}
            onClick={() => onTableSelect(table.name)}
            className={`w-full p-2 text-left rounded-md hover:bg-gray-100 ${
              selectedTable === table.name ? 'bg-gray-100' : ''
            }`}
          >
            {!isCollapsed && table.name}
          </button>
        ))}
      </nav>
    </div>
  );
} 