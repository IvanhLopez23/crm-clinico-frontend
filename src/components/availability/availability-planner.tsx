"use client";

import { CalendarDays, Clock3, LoaderCircle, Search, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  bookAppointmentAction,
  getAvailabilityAction,
} from "@/app/actions/appointments";
import { searchPatientsAction } from "@/app/actions/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";
import { formatDate, formatTime } from "@/lib/dates";
import { money } from "@/lib/format";
import { servicesForPractitioner } from "@/lib/practitioner-services";
import type {
  AvailabilitySlot,
  PatientSearchResult,
  Practitioner,
  PractitionerService,
  Service,
} from "@/lib/types";

export function AvailabilityPlanner({
  practitioners,
  services,
  practitionerServices,
  timezone,
  initialPractitionerId,
  initialDate,
}: {
  practitioners: Practitioner[];
  services: Service[];
  practitionerServices: PractitionerService[];
  timezone: string;
  initialPractitionerId: string | null;
  initialDate: string;
}) {
  const { t } = useI18n();
  const [practitionerId, setPractitionerId] = useState(
    initialPractitionerId ?? practitioners[0]?.id ?? "",
  );
  const [date, setDate] = useState(initialDate);
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const availableServices = useMemo(
    () => servicesForPractitioner(practitionerId, services, practitionerServices),
    [practitionerId, practitionerServices, services],
  );
  const service = availableServices.find((item) => item.id === serviceId) ?? null;

  useEffect(() => {
    setServiceId((current) =>
      availableServices.some((item) => item.id === current)
        ? current
        : availableServices[0]?.id ?? "",
    );
  }, [availableServices]);

  useEffect(() => {
    if (!practitionerId || !serviceId || !date) {
      setSlots([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setSelected(null);

    getAvailabilityAction({
      practitionerId,
      serviceId,
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
  }, [date, practitionerId, refreshKey, serviceId]);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="practitioner">{t("common.specialist")}</Label>
            <Select
              value={practitionerId}
              onValueChange={(value) => {
                setPractitionerId(value);
                setSelected(null);
              }}
            >
              <SelectTrigger id="practitioner">
                <SelectValue placeholder={t("availability.selectPractitioner")} />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.fullName}
                    {practitioner.specialty ? ` · ${practitioner.specialty}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">{t("common.service")}</Label>
            <Select
              value={serviceId}
              onValueChange={(value) => {
                setServiceId(value);
                setSelected(null);
              }}
              disabled={availableServices.length === 0}
            >
              <SelectTrigger id="service">
                <SelectValue placeholder={t("availability.selectService")} />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.durationMinutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t("common.date")}</Label>
            <DatePicker
              id="date"
              value={date}
              onChange={(next) => {
                setDate(next);
                setSelected(null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("availability.availableSlots")}</CardTitle>
            <CardDescription className="mt-0.5 capitalize">
              {date ? formatDate(date, timezone) : t("common.selectDate")}
              {service
                ? ` · ${service.durationMinutes} min · ${money(service.priceCents, service.currency)}`
                : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {service ? <Badge variant="secondary">{service.name}</Badge> : null}
            <span className="text-xs text-muted">
              {loading
                ? t("availability.searching")
                : t("availability.slots", { count: slots.length })}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {availableServices.length === 0 ? (
            <p className="text-sm text-muted">
              {t("availability.noServices")}
            </p>
          ) : loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-xl border border-line bg-canvas"
                />
              ))}
            </div>
          ) : error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : slots.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-5">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
              <div>
                <p className="text-sm font-medium">{t("availability.noSlotsTitle")}</p>
                <p className="mt-1 text-xs text-muted">
                  {t("availability.noSlotsHint")}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot) => (
                <Button
                  key={slot.startsAt}
                  type="button"
                  variant="outline"
                  className="tabular-nums"
                  onClick={() => setSelected(slot)}
                >
                  {formatTime(slot.startsAt, timezone)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          {selected ? (
            <BookingDialog
              slot={selected}
              practitioner={
                practitioners.find((item) => item.id === practitionerId) ?? null
              }
              service={service}
              timezone={timezone}
              onClose={() => setSelected(null)}
              onBooked={() => {
                setSelected(null);
                setRefreshKey((value) => value + 1);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingDialog({
  slot,
  practitioner,
  service,
  timezone,
  onClose,
  onBooked,
}: {
  slot: AvailabilitySlot;
  practitioner: Practitioner | null;
  service: Service | null;
  timezone: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      setAttempted(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setAttempted(false);
      const found = await searchPatientsAction(term);
      if (!active) return;
      setResults(found);
      setSearching(false);
      setAttempted(true);
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  function submit() {
    if (!patient) {
      setError(t("agenda.selectPatientError"));
      return;
    }
    if (!service || !practitioner) {
      setError(t("agenda.missingServiceError"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await bookAppointmentAction({
        patientId: patient.id,
        practitionerId: practitioner.id,
        serviceId: service.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("agenda.booked"));
      onBooked();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("agenda.bookTitle")}</DialogTitle>
        <DialogDescription>
          {t("agenda.bookHint")}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-xl border border-line bg-canvas p-4">
        <p className="text-lg font-semibold tabular-nums">
          {formatTime(slot.startsAt, timezone)} –{" "}
          {formatTime(slot.endsAt, timezone)}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {practitioner?.fullName ?? t("common.specialist")} ·{" "}
          {service
            ? `${service.name} · ${service.durationMinutes} min`
            : t("sala.consultation")}
        </p>
        {service ? (
          <p className="mt-1 text-xs text-muted">
            {money(service.priceCents, service.currency)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-search">{t("common.patient")}</Label>

        {patient ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserRound className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-900">
                  {patient.preferredName ?? patient.firstName} {patient.lastName}
                </p>
                <p className="truncate text-xs text-brand-800">
                  {patient.phoneMasked ?? patient.emailMasked ?? t("patients.noContact")}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPatient(null);
                setQuery("");
                setResults([]);
              }}
            >
              {t("common.change")}
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                id="patient-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("patients.searchPlaceholder")}
                autoComplete="off"
                className="pl-9"
              />
              {searching ? (
                <LoaderCircle
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
                  aria-hidden
                />
              ) : null}
            </div>

            {results.length > 0 ? (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPatient(result);
                        setResults([]);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-canvas"
                    >
                      <span className="truncate">
                        {result.preferredName ?? result.firstName}{" "}
                        {result.lastName}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {result.phoneMasked ?? result.emailMasked ?? ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {!searching && attempted && results.length === 0 ? (
              <p className="text-xs text-muted">
                {t("agenda.noResultsShort")}
              </p>
            ) : null}
          </>
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="h-4 w-4" aria-hidden />
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={pending || !patient || !service}
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CalendarDays className="h-4 w-4" aria-hidden />
          )}
          {pending ? t("agenda.booking") : t("agenda.confirm")}
        </Button>
      </DialogFooter>
    </>
  );
}
