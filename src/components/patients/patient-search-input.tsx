"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";

export function PatientSearchInput({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const query = value.trim();
    if (query === initialQuery.trim()) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.length >= 2) params.set("q", query);
      const target = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [initialQuery, pathname, router, value]);

  return (
    <div role="search" className="card flex items-center gap-2 p-3">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("patients.searchPlaceholder")}
          autoComplete="off"
          className="focus-ring w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-10 text-sm shadow-sm placeholder:text-slate-400"
          aria-label={t("patients.searchAria")}
        />
        {pending ? (
          <LoaderCircle
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden
          />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label={t("patients.clearSearch")}
            className="focus-ring absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
