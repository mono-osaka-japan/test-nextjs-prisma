'use client';

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = '読み込み中...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"
          aria-hidden="true"
        />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
