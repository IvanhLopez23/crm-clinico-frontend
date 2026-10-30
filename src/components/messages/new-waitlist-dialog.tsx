"use client";

import { LoaderCircle, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchPatientsAction } from "@/app/actions/patients";
import { createWaitlistEntryAction } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";
import type { PatientSearchResult, Practitioner } from "@/lib/types";

export function NewWaitlistDialog({
  practitioners,
}: {
  practitioners: Practitioner[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        {t("waitlist.title")}
      </Button>
      {open ? (
        <WaitlistForm
          practitioners={practitioners}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function WaitlistForm({
  practitioners,
  onClose,
}: {
  practitioners: Practitioner[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [practitionerId, setPractitionerId] = useState("any");
  const [earliestDate, setEarliestDate] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [priority, setPriority] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      const found = await searchPatientsAction(term);
      if (!active) return;
      setResults(found);
      setSearching(false);
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  function submit() {
    setError(null);
    if (!patient) return setError(t("agenda.selectPatientError"));
    if (!earliestDate || !latestDate) {
      return setError(t("waitlist.dateRangeError"));
    }
    if (latestDate < earliestDate) {
      return setError(t("waitlist.dateOrderError"));
    }

    startTransition(async () => {
      const result = await createWaitlistEntryAction({
        patientId: patient.id,
        ...(practitionerId !== "any" ? { practitionerId } : {}),
        earliestDate,
        latestDate,
        ...(timeFrom ? { preferredTimeFrom: timeFrom } : {}),
        ...(timeTo ? { preferredTimeTo: timeTo } : {}),
        priority: Number(priority) || 0,
        ...(notes ? { notes } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("waitlist.success"));
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("waitlist.title")}</DialogTitle>
          <DialogDescription>
            El paciente recibirá ofertas cuando se libere un hueco compatible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-patient">{t("waitlist.patient")}</Label>
            {patient ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5">
                <p className="text-sm font-medium text-brand-900">
                  {patient.preferredName ?? patient.firstName} {patient.lastName}
                </p>
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
                  Cambiar
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
                    id="waitlist-patient"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("patients.searchPlaceholder")}
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
                  <ul className="max-h-44 divide-y divide-line overflow-y-auto rounded-xl border border-line">
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
                          <span>
                            {result.preferredName ?? result.firstName}{" "}
                            {result.lastName}
                          </span>
                          <span className="text-xs text-muted">
                            {result.phoneMasked ?? result.emailMasked ?? ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("waitlist.specialist")}</Label>
              <Select
                value={practitionerId}
                onValueChange={setPractitionerId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("waitlist.any")}</SelectItem>
                  {practitioners.map((practitioner) => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      {practitioner.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("waitlist.priority")}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("waitlist.from")}</Label>
              <DatePicker
                value={earliestDate}
                onChange={setEarliestDate}
                placeholder={t("waitlist.fromDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("waitlist.to")}</Label>
              <DatePicker
                value={latestDate}
                onChange={setLatestDate}
                placeholder={t("waitlist.toDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("waitlist.timeFrom")}</Label>
              <Input
                type="time"
                value={timeFrom}
                onChange={(event) => setTimeFrom(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("waitlist.timeTo")}</Label>
              <Input
                type="time"
                value={timeTo}
                onChange={(event) => setTimeTo(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitlist-notes">{t("waitlist.notes")}</Label>
            <Input
              id="waitlist-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("common.optional")}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {pending ? t("waitlist.adding") : t("waitlist.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
