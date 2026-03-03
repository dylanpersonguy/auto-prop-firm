'use client';

import { useState, useCallback, createContext, useContext } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };
type ToastCtx = { addToast: (message: string, type?: Toast['type']) => void };

const Ctx = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const colors = {
    success: 'bg-green-900/90 border-green-700 text-green-300',
    error: 'bg-red-900/90 border-red-700 text-red-300',
    info: 'bg-gray-900/90 border-gray-700 text-gray-300',
  };

  return (
    <Ctx.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${colors[t.type]} border rounded-lg px-4 py-3 text-sm shadow-xl flex items-start gap-2 animate-slide-up`}
            role="alert"
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 text-xs">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
