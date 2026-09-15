"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from "react-icons/fi";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside <ToastProvider>"
    );
  }

  return context;
}

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const ICONS: Record<ToastType, typeof FiCheckCircle> = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random()}`;

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];

          return (
            <div
              key={toast.id}
              style={{ animation: "toast-in 0.2s ease-out" }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl ${STYLES[toast.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />

              <p className="flex-1 text-sm font-semibold">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-current opacity-60 transition hover:opacity-100"
              >
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
