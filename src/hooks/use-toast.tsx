"use client";

import { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

let toastListeners: Array<(toast: ToastOptions | null) => void> = [];

export const toast = {
  show: (message: string, type: ToastType = 'success', duration = 3000) => {
    const toastData = { message, type, duration };
    toastListeners.forEach(listener => listener(toastData));
    
    if (duration !== Infinity) {
      setTimeout(() => {
        toastListeners.forEach(listener => listener(null));
      }, duration);
    }
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
};

export function useToast() {
  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    toast.show(message, type, duration);
  }, []);

  return { showToast };
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  useEffect(() => {
    const listener = (newToast: ToastOptions | null) => setToast(newToast);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (!toast) return null;

  const bgClass = toast.type === 'success' 
    ? 'bg-green-50 border-green-200 text-green-800' 
    : toast.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
      <div className={`px-5 py-3.5 rounded-2xl shadow-2xl border ${bgClass} min-w-[300px] flex items-center justify-between gap-4`}>
        <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        <button 
          onClick={() => setToast(null)}
          className="text-current opacity-40 hover:opacity-100 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
