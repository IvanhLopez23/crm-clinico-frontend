"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { updateTenantAction } from "@/app/actions/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastActionState } from "@/lib/use-toast-action";
import { useI18n } from "@/i18n/client";
import type { TenantDetail } from "@/lib/types";

const TIMEZONES = [
  "America/Mexico_City",
  "America/Monterrey",
  "America/Cancun",
  "America/Tijuana",
  "America/Chihuahua",
  "America/Merida",
  "America/Hermosillo",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
];

const CURRENCIES = ["MXN", "USD", "EUR", "COP", "PEN", "CLP", "ARS"];

export function TenantSettingsForm({ tenant }: { tenant: TenantDetail }) {
  const { t } = useI18n();
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [currency, setCurrency] = useState(tenant.currency);
  const [error, formAction, pending] = useToastActionState(
    updateTenantAction,
    "Tenant actualizado",
  );

  return (
    <form action={formAction} className="card p-5">
      <input type="hidden" name="clinicId" value={tenant.id} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{t("tenant.settingsTitle")}</h2>
          <p className="text-xs text-muted">
            {t("tenant.settingsHint")}
          </p>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5" aria-hidden />
          )}
          {pending ? t("tenant.saving") : t("tenant.save")}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tenant-name">{t("tenant.name")}</Label>
          <Input
            id="tenant-name"
            name="name"
            defaultValue={tenant.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-timezone">{t("tenant.timezone")}</Label>
          <input type="hidden" name="timezone" value={timezone} />
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="tenant-timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-currency">{t("tenant.currency")}</Label>
          <input type="hidden" name="currency" value={currency} />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="tenant-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={tenant.isActive}
          className="mt-0.5 h-4 w-4 rounded border-line"
        />
        <span>
          <span className="block font-medium">{t("tenant.active")}</span>
          <span className="block text-xs text-muted">
            Si lo desactivas, sus usuarios no podrán iniciar sesión.
          </span>
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
