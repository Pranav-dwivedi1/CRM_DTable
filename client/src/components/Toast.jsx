import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, opts) => addToast({ message, type: 'success', ...opts }),
    error: (message, opts) => addToast({ message, type: 'error', ...opts }),
    info: (message, opts) => addToast({ message, type: 'info', ...opts }),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

const TOAST_STYLES = {
  success: {
    border: 'border-green-500/30',
    icon: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
    title: 'text-green-400'
  },
  error: {
    border: 'border-red-500/30',
    icon: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
    title: 'text-red-400'
  },
  info: {
    border: 'border-brand-500/30',
    icon: <AlertCircle className="h-4 w-4 text-brand-400 shrink-0" />,
    title: 'text-brand-400'
  }
};

function ToastItem({ toast, onRemove }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      className={`pointer-events-auto glass-panel rounded-2xl p-4 border ${style.border} shadow-2xl flex items-start gap-3 modal-enter`}
    >
      {style.icon}
      <p className="flex-1 text-xs text-slate-200 font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
