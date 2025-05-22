'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  columnCount: number;
}

export default function LoadingState({ columnCount }: LoadingStateProps) {
  return (
    <tr>
      <td colSpan={columnCount} className="px-2 py-1 text-center">
        <Loader2 className="animate-spin mx-auto h-4 w-4" />
      </td>
    </tr>
  );
} 