"use client";

import { CalendarCheck2, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function SpecialistBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const profile = pathname === "/mi-dia" && searchParams.get("tab") === "perfil";

  const items = [
    {
      href: "/mi-dia",
      label: t("specialist.myDay"),
      icon: CalendarCheck2,
      active: !profile,
    },
    {
      href: "/mi-dia?tab=perfil",
      label: t("specialist.myProfile"),
      icon: UserRound,
      active: profile,
    },
  ];

  return (
    <nav
      aria-label={t("specialist.nav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-1 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium ${
              active ? "bg-brand-50 text-brand-800" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
