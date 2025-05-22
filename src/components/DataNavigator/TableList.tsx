interface Table {
  name: string;
  ordinal: number;
  active: boolean;
}

interface TableListProps {
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
  tables: Table[];
  title?: string;
}

export default function TableList({ selectedTable, onTableSelect, tables, title = 'Tables/Views' }: TableListProps) {
  return (
    <div className="bg-white shadow-lg w-64">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <nav className="p-2">
        {tables.map((table) => (
          <button
            key={table.name}
            onClick={() => onTableSelect(table.name)}
            className={`w-full p-2 text-left rounded-md hover:bg-gray-100 ${
              selectedTable === table.name ? 'bg-gray-100' : ''
            }`}
          >
            {table.name}
          </button>
        ))}
      </nav>
    </div>
  );
} 