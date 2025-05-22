'use client';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = 'Select a table to view data' }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">{message}</p>
    </div>
  );
} 