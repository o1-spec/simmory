"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ChefHat,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms, default 4000
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Standalone event dispatcher for use outside React tree if ever needed
let globalAddToast: ((options: ToastOptions) => string) | null = null;

export const toast = {
  show: (options: ToastOptions) => globalAddToast?.(options) ?? "",
  success: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    globalAddToast?.({
      title,
      description,
      type: "success",
      ...options,
    }) ?? "",
  error: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    globalAddToast?.({
      title,
      description,
      type: "error",
      duration: options?.duration ?? 5000,
      ...options,
    }) ?? "",
  info: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    globalAddToast?.({
      title,
      description,
      type: "info",
      ...options,
    }) ?? "",
  warning: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    globalAddToast?.({
      title,
      description,
      type: "warning",
      ...options,
    }) ?? "",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      ...options,
      id,
      type: options.type ?? "info",
      duration: options.duration ?? 4500,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    ...context,
    toast,
  };
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed z-[100] bottom-4 right-4 sm:top-5 sm:bottom-auto flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastMessage key={item.id} toast={item} onDismiss={() => onRemove(item.id)} />
      ))}
    </aside>
  );
}

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const intervalTime = 50;
    const step = (intervalTime / toast.duration) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast.duration, isHovered, onDismiss]);

  const typeConfig = {
    success: {
      border: "border-[#2E4742]/20",
      accent: "bg-[#2E4742] text-[#F2F2EB]",
      bar: "bg-[#2E4742]",
      icon: CheckCircle2,
    },
    error: {
      border: "border-[#E97B77]/40",
      accent: "bg-[#E97B77] text-white",
      bar: "bg-[#E97B77]",
      icon: AlertCircle,
    },
    warning: {
      border: "border-[#F5B726]/40",
      accent: "bg-[#F5B726] text-[#202723]",
      bar: "bg-[#F5B726]",
      icon: AlertTriangle,
    },
    info: {
      border: "border-[#8BB2DE]/40",
      accent: "bg-[#2E4742] text-[#F2F2EB]",
      bar: "bg-[#8BB2DE]",
      icon: Sparkles,
    },
  };

  const config = typeConfig[toast.type || "info"];
  const Icon = config.icon;

  return (
    <div
      role="status"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-xl bg-[#FAF9F5] border shadow-xl shadow-[#202723]/08 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2",
        config.border
      )}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
            config.accent
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-sm font-semibold text-[#202723] leading-snug">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="mt-0.5 text-xs text-[#202723]/70 leading-relaxed break-words">
              {toast.description}
            </p>
          )}

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-2 text-xs font-semibold text-[#2E4742] hover:underline block"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-[#202723]/40 hover:text-[#202723] p-1 rounded-md hover:bg-[#202723]/05 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress indicator */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-0.5 w-full bg-[#DDDCD3]/40 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-75 ease-linear", config.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
