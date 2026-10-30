"use client";

import { LoaderCircle, Receipt, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkoutAppointmentAction } from "@/app/actions/payments";
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
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";
import { money } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export function CheckoutButton({
  appointment,
  compact = false,
}: {
  appointment: Appointment;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!["in_consultation", "completed"].includes(appointment.status)) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        onClick={() => setOpen(true)}
      >
        <Receipt className="h-4 w-4" aria-hidden />
        {appointment.status === "in_consultation"
          ? "Cobrar y cerrar"
          : "Registrar cobro"}
      </Button>

      {open ? (
        <CheckoutDialog
          appointment={appointment}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CheckoutDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [amount, setAmount] = useState(
    (appointment.priceCentsSnapshot / 100).toFixed(2),
  );
  const [method, setMethod] = useState<"cash" | "card" | "transfer" | "other">(
    "cash",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      setError(t("validation.amountInvalid"));
      return;
    }

    startTransition(async () => {
      const result = await checkoutAppointmentAction({
        appointmentId: appointment.id,
        amountCents,
        method,
        ...(notes ? { notes } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Cobro registrado y cita cerrada");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("checkout.title")}</DialogTitle>
          <DialogDescription>
            {appointment.patientFirstName} {appointment.patientLastName} ·{" "}
            {appointment.serviceNameSnapshot ?? t("sala.consultation")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="text-xs text-muted">{t("checkout.servicePrice")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {money(
              appointment.priceCentsSnapshot,
              appointment.currencySnapshot ?? "MXN",
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            {appointment.durationMinutesSnapshot ?? 30} min ·{" "}
            {appointment.practitionerName}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkout-amount">{t("checkout.amount")}</Label>
            <Input
              id="checkout-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-method">{t("checkout.method")}</Label>
            <Select
              value={method}
              onValueChange={(value) =>
                setMethod(value as typeof method)
              }
            >
              <SelectTrigger id="checkout-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("checkout.cash")}</SelectItem>
                <SelectItem value="card">{t("checkout.card")}</SelectItem>
                <SelectItem value="transfer">{t("checkout.transfer")}</SelectItem>
                <SelectItem value="other">{t("checkout.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-notes">{t("checkout.notes")}</Label>
          <Input
            id="checkout-notes"
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Receipt className="h-4 w-4" aria-hidden />
            )}
            {pending ? t("checkout.processing") : t("checkout.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
