"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/i18n/client";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { wrap: string; icon: string; bar: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
    icon: "bg-emerald-600 text-white",
    bar: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-100",
    icon: "bg-rose-600 text-white",
    bar: "bg-rose-500",
    Icon: AlertTriangle,
  },
  info: {
    wrap: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-50",
    icon: "bg-brand-700 text-white",
    bar: "bg-brand-600",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setItems((current) => [...current.slice(-3), { id, message, variant }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
      info: (message: string) => push(message, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const style = VARIANT_STYLES[item.variant];
  const Icon = style.Icon;

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(() => onRemove(item.id), 180);
  }, [item.id, onRemove]);

  useEffect(() => {
    const timer = window.setTimeout(close, 4200);
    return () => window.clearTimeout(timer);
  }, [close]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className={`toast-card pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 pr-11 shadow-lg shadow-slate-900/10 ${
        style.wrap
      } ${leaving ? "toast-out" : "toast-in"}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.icon}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm font-medium leading-snug">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label={t("common.closeNotification")}
        className="focus-ring absolute right-2 top-2 rounded-lg p-1.5 opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      {!leaving ? (
        <span
          className={`toast-progress absolute inset-x-0 bottom-0 h-0.5 ${style.bar}`}
          style={{ animationDuration: "4200ms" }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
