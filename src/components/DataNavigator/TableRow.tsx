'use client';

interface TableRowProps {
  row: Record<string, any>;
  columns: Array<{
    name: string;
    type: string;
    ordinal: number;
  }>;
  index: number;
  isLastRow: boolean;
  onRowRef: (node: HTMLTableRowElement) => void;
  onCellDoubleClick: (columnName: string, value: any) => void;
}

export default function TableRow({
  row,
  columns,
  index,
  isLastRow,
  onRowRef,
  onCellDoubleClick
}: TableRowProps) {
  return (
    <tr
      ref={isLastRow ? onRowRef : undefined}
      className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    >
      {columns.map(column => (
        <td 
          key={column.name} 
          className="px-2 py-1 whitespace-nowrap hover:bg-gray-100 cursor-pointer"
          onDoubleClick={() => {
            const value = row[column.name];
            if (value !== null && value !== undefined) {
              onCellDoubleClick(column.name, value);
            }
          }}
        >
          {row[column.name]}
        </td>
      ))}
    </tr>
  );
} 