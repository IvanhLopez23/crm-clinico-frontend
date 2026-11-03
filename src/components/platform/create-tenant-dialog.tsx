"use client";

import { Building2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTenantAction } from "@/app/actions/platform";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México" },
  { value: "America/Monterrey", label: "Monterrey" },
  { value: "America/Cancun", label: "Cancún" },
  { value: "America/Tijuana", label: "Tijuana" },
  { value: "America/Chihuahua", label: "Chihuahua" },
  { value: "America/Merida", label: "Mérida" },
  { value: "America/Hermosillo", label: "Hermosillo" },
  { value: "America/Bogota", label: "Bogotá" },
  { value: "America/Lima", label: "Lima" },
  { value: "America/Santiago", label: "Santiago" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "Europe/Madrid", label: "Madrid" },
];

const CURRENCIES = ["MXN", "USD", "EUR", "COP", "PEN", "CLP", "ARS"];

export function CreateTenantDialog() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        {t("platform.newTenant")}
      </Button>

      {open ? (
        <TenantForm
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function TenantForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [currency, setCurrency] = useState("MXN");
  const [error, formAction, pending] = useToastActionState(
    createTenantAction,
    "Tenant creado correctamente",
    onCreated,
  );

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-700" aria-hidden />
            {t("platform.newTenant")}
          </DialogTitle>
          <DialogDescription>
            Crea la clínica y su primer usuario administrador.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <section className="space-y-3">
            <p className="text-sm font-semibold">{t("tenant.clinic")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tenant-name">{t("tenant.name")} *</Label>
                <Input
                  id="tenant-name"
                  name="name"
                  placeholder="Clínica del Valle"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tenant-slug">{t("tenant.slug")}</Label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-lg border border-line bg-canvas px-2.5 py-2 text-xs text-muted">
                    /reservar/
                  </span>
                  <Input
                    id="tenant-slug"
                    name="slug"
                    placeholder="clinica-del-valle"
                  />
                </div>
                <p className="text-[11px] text-muted">
                  {t("tenant.slugCreateHint")}
                </p>
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
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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

              <div className="space-y-2">
                <Label htmlFor="tenant-latitude">{t("platform.latitude")}</Label>
                <Input
                  id="tenant-latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  min={-90}
                  max={90}
                  placeholder="19.4326"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-longitude">
                  {t("platform.longitude")}
                </Label>
                <Input
                  id="tenant-longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  min={-180}
                  max={180}
                  placeholder="-99.1332"
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              {t("platform.coordinatesHint")}
            </p>
          </section>

          <section className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-semibold">{t("tenant.usersTitle")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tenant-admin-name">{t("tenant.fullName")} *</Label>
                <Input
                  id="tenant-admin-name"
                  name="adminName"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-admin-email">{t("tenant.email")} *</Label>
                <Input
                  id="tenant-admin-email"
                  name="adminEmail"
                  type="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-admin-password">{t("tenant.password")} *</Label>
                <Input
                  id="tenant-admin-password"
                  name="adminPassword"
                  type="password"
                  minLength={8}
                  required
                />
              </div>
            </div>
          </section>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {pending ? t("common.loading") : t("platform.newTenant")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
