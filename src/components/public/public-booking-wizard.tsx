"use client";

import { CalendarDays, CheckCircle2, Clock3, LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  bookPublicAppointmentAction,
  getPublicAvailabilityAction,
} from "@/app/actions/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/client";
import { formatDate, formatTime } from "@/lib/dates";
import { money } from "@/lib/format";
import type { AvailabilitySlot, PublicClinicData } from "@/lib/types";

type ServiceOption = PublicClinicData["services"][number];

export function PublicBookingWizard({ data }: { data: PublicClinicData }) {
  const { t } = useI18n();
  const [serviceId, setServiceId] = useState(data.services[0]?.id ?? "");
  const [practitionerId, setPractitionerId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    startsAt: string;
    status: string;
  } | null>(null);

  const service = data.services.find((item) => item.id === serviceId) ?? null;

  const availablePractitioners = useMemo(() => {
    if (!serviceId) return data.practitioners;
    const assigned = data.assignments.filter(
      (item) => item.serviceId === serviceId,
    );
    if (assigned.length === 0) return data.practitioners;
    const ids = new Set(assigned.map((item) => item.practitionerId));
    return data.practitioners.filter((item) => ids.has(item.id));
  }, [data.assignments, data.practitioners, serviceId]);

  const effectiveService = useMemo<ServiceOption | null>(() => {
    if (!service) return null;
    const override = data.assignments.find(
      (item) =>
        item.serviceId === service.id && item.practitionerId === practitionerId,
    );
    return override
      ? {
          ...service,
          durationMinutes: override.durationMinutes,
          priceCents: override.priceCents,
          currency: override.currency,
        }
      : service;
  }, [data.assignments, practitionerId, service]);

  useEffect(() => {
    if (
      practitionerId &&
      !availablePractitioners.some((item) => item.id === practitionerId)
    ) {
      setPractitionerId("");
    }
  }, [availablePractitioners, practitionerId]);

  useEffect(() => {
    if (!serviceId || !practitionerId || !date) {
      setSlots([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setSelected(null);
    getPublicAvailabilityAction({
      slug: data.clinic.slug,
      serviceId,
      practitionerId,
      date,
    }).then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setSlots([]);
        setError(result.error);
        return;
      }
      setSlots(result.data.slots);
    });
    return () => {
      active = false;
    };
  }, [data.clinic.slug, date, practitionerId, serviceId]);

  function submit() {
    if (!selected || !effectiveService || !practitionerId) {
      setError(t("public.error"));
      return;
    }
    if (!firstName.trim() || !lastName.trim() || phone.trim().length < 7) {
      setError(t("public.required"));
      return;
    }
    setError(null);
    setPending(true);
    bookPublicAppointmentAction({
      slug: data.clinic.slug,
      serviceId: effectiveService.id,
      practitionerId,
      startsAt: selected.startsAt,
      endsAt: selected.endsAt,
      patient: {
        firstName,
        lastName,
        phone,
        ...(email ? { email } : {}),
      },
    }).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmed({
        startsAt: result.appointment.startsAt,
        status: result.appointment.status,
      });
    });
  }

  if (confirmed) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <div>
            <h2 className="text-xl font-semibold">{t("public.confirmedTitle")}</h2>
            <p className="mt-1 text-sm text-muted">
              La clínica confirmará tu cita. Guarda estos datos.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-4 text-left text-sm">
            <p className="font-medium">{data.clinic.name}</p>
            <p className="mt-1 text-muted">
              {formatDate(confirmed.startsAt, data.clinic.timezone)} ·{" "}
              {formatTime(confirmed.startsAt, data.clinic.timezone)}
            </p>
            <p className="mt-1 text-muted">
              {effectiveService?.name} · {practitionerName(data, practitionerId)}
            </p>
            <Badge variant="warning" className="mt-2">
              Pendiente de confirmación
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmed(null);
              setSelected(null);
              setSlots([]);
              setDate("");
            }}
          >
            {t("public.another")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("public.choose")}</CardTitle>
            <CardDescription className="mt-1">
              {t("public.chooseHint")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>{t("common.service")}</Label>
            <Select
              value={serviceId}
              onValueChange={(value) => {
                setServiceId(value);
                setSelected(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("public.selectService")} />
              </SelectTrigger>
              <SelectContent>
                {data.services.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.durationMinutes} min ·{" "}
                    {money(item.priceCents, item.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("common.specialist")}</Label>
              <Select
                value={practitionerId}
                onValueChange={(value) => {
                  setPractitionerId(value);
                  setSelected(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("public.select")} />
                </SelectTrigger>
                <SelectContent>
                  {availablePractitioners.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("common.date")}</Label>
              <DatePicker
                value={date}
                onChange={(next) => {
                  setDate(next);
                  setSelected(null);
                }}
                placeholder={t("common.selectDate")}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">{t("public.slots")}</p>
            {loading ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                Buscando horarios…
              </p>
            ) : !serviceId || !practitionerId || !date ? (
              <p className="mt-2 text-sm text-muted">
                {t("public.completeToSee")}
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                {t("public.noSlots")}
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <Button
                    key={slot.startsAt}
                    type="button"
                    variant={
                      selected?.startsAt === slot.startsAt ? "default" : "outline"
                    }
                    className="tabular-nums"
                    onClick={() => setSelected(slot)}
                  >
                    {formatTime(slot.startsAt, data.clinic.timezone)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle> {t("public.yourData")}</CardTitle>
            <CardDescription className="mt-1">
              {t("public.yourDataHint")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-line bg-canvas p-4 text-sm">
            {selected && effectiveService ? (
              <>
                <p className="flex items-center gap-2 font-medium">
                  <CalendarDays className="h-4 w-4 text-brand-700" aria-hidden />
                  {formatDate(selected.startsAt, data.clinic.timezone)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-muted">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  {formatTime(selected.startsAt, data.clinic.timezone)} ·{" "}
                  {effectiveService.durationMinutes} min
                </p>
                <p className="mt-1 flex items-center gap-2 text-muted">
                  <UserRound className="h-4 w-4" aria-hidden />
                  {practitionerName(data, practitionerId)}
                </p>
                <p className="mt-2 font-semibold">
                  {money(effectiveService.priceCents, effectiveService.currency)}
                </p>
              </>
            ) : (
              <p className="text-muted">
                {t("public.selectSlot")}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="public-first-name">{t("public.firstName")}</Label>
              <Input
                id="public-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-last-name">{t("public.lastName")}</Label>
              <Input
                id="public-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-phone">{t("public.phone")}</Label>
            <Input
              id="public-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+52 55 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-email">{t("public.email")}</Label>
            <Input
              id="public-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={pending || !selected}
            onClick={submit}
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            {pending ? t("public.sending") : t("public.request")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function practitionerName(data: PublicClinicData, id: string): string {
  return (
    data.practitioners.find((item) => item.id === id)?.fullName ?? "—"
  );
}
