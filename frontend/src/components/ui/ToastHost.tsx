import { useEffect, useState } from 'react';
import { cn } from '@/utils';
import type { ToastType } from '@/utils/toast';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type?: ToastType }>).detail;
      if (!detail?.message) return;
      const id = Date.now();
      setToasts((items) => [...items, { id, message: detail.message, type: detail.type ?? 'success' }]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((toast) => toast.id !== id));
      }, 3500);
    };
    window.addEventListener('fems:toast', handler);
    return () => window.removeEventListener('fems:toast', handler);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
            toastStyles[toast.type],
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
