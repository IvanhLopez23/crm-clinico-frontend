"use client";

import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  DoorOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/messages";

const ITEMS: Array<{
  href: string;
  label: MessageKey;
  icon: typeof CalendarDays;
  nonPractitioner?: boolean;
  practitionerOnly?: boolean;
  adminOnly?: boolean;
}> = [
  {
    href: "/",
    label: "nav.dashboard",
    icon: LayoutDashboard,
    nonPractitioner: true,
  },
  {
    href: "/mi-dia",
    label: "nav.myDay",
    icon: CalendarCheck2,
    practitionerOnly: true,
  },
  { href: "/agenda", label: "nav.agenda", icon: CalendarDays },
  { href: "/sala", label: "nav.room", icon: DoorOpen },
  { href: "/mensajes", label: "nav.messages", icon: MessageSquare },
  { href: "/pacientes", label: "nav.patients", icon: UsersRound },
  { href: "/especialistas", label: "nav.specialists", icon: Stethoscope },
  { href: "/availability", label: "nav.availability", icon: Clock3 },
  {
    href: "/configuracion",
    label: "nav.settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function AppNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = ITEMS.filter(
    (item) =>
      (!item.adminOnly || role === "admin") &&
      (!item.practitionerOnly || role === "practitioner") &&
      (!item.nonPractitioner || role !== "practitioner"),
  );

  return (
    <nav aria-label={t("nav.main")} className="flex gap-1 lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-800"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
