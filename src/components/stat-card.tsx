import type { LucideIcon } from "lucide-react";

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="card flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </div>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONES[tone]}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}
