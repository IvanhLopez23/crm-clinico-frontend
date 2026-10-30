"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/i18n/client";

export function Modal({
  title,
  description,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const { t } = useI18n();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 dark:bg-black/60">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-6 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
