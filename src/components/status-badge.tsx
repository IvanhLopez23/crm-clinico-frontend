"use client";

import { statusMeta } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/messages";

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  const { t } = useI18n();
  const translated = t(`status.${status}` as MessageKey);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}
    >
      {translated.startsWith("status.") ? meta.label : translated}
    </span>
  );
}
