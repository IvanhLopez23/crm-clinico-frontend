"use client";

import { Check, ChevronDown, Globe2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const LOCALES: Array<{ value: Locale; short: string }> = [
  { value: "es", short: "ES" },
  { value: "en", short: "EN" },
];

export function LanguageSwitcher({
  compact = false,
  toggle = false,
}: {
  compact?: boolean;
  toggle?: boolean;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = LOCALES.find((item) => item.value === locale) ?? LOCALES[0];

  function labelFor(value: Locale): string {
    return value === "es" ? t("common.spanish") : t("common.english");
  }

  function change(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  if (toggle) {
    const next: Locale = locale === "es" ? "en" : "es";

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => change(next)}
        disabled={pending}
        aria-label={`${t("common.language")}: ${labelFor(next)}`}
        title={`${t("common.language")}: ${labelFor(next)}`}
        className="h-9 gap-1.5 px-2 text-xs font-medium text-muted"
      >
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Globe2 className="size-3.5" aria-hidden />
        )}
        <span className="text-ink">{next.toUpperCase()}</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={t("common.language")}
          title={t("common.language")}
          disabled={pending}
          className="h-9 gap-1.5 px-2 text-xs font-medium text-muted"
        >
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Globe2 className="size-3.5" aria-hidden />
          )}
          <span className="text-ink">{compact ? current.short : labelFor(current.value)}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {LOCALES.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${labelFor(item.value)} ${item.short}`}
                  onSelect={() => change(item.value)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      locale === item.value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span>{labelFor(item.value)}</span>
                  <span className="ml-auto text-xs text-muted">{item.short}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
