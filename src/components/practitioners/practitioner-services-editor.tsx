"use client";

import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  deletePractitionerServiceAction,
  savePractitionerServiceAction,
} from "@/app/actions/practitioners";
import { ActionForm } from "@/components/ui/action-form";
import { Modal } from "@/components/ui/modal";
import { useToastActionState } from "@/lib/use-toast-action";
import { useI18n } from "@/i18n/client";
import { money } from "@/lib/format";
import type { PractitionerService, Service } from "@/lib/types";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; assignment: PractitionerService }
  | null;

export function PractitionerServicesEditor({
  practitionerId,
  assignments,
  services,
  canEdit,
  defaultDuration = 30,
}: {
  practitionerId: string;
  assignments: PractitionerService[];
  services: Service[];
  canEdit: boolean;
  defaultDuration?: number;
}) {
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorState>(null);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("practitioners.servicesTitle")}</h2>
          <p className="text-xs text-muted">
            {t("practitioners.servicesHint")}
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t("practitioners.addService")}
          </button>
        ) : null}
      </div>

      {assignments.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          {t("practitioners.noServices")}{" "}
          {canEdit ? t("practitioners.noServicesHint") : ""}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${
                assignment.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {assignment.name}
                  {!assignment.isActive ? (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      Inactivo
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {assignment.durationMinutes} min ·{" "}
                  {money(assignment.priceCents, assignment.currency)} ·{" "}
                  {assignment.code}
                </p>
              </div>

              {canEdit ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", assignment })}
                    className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                    {t("practitioners.editService")}
                  </button>
                  <ActionForm
                    action={deletePractitionerServiceAction}
                    successMessage={t("practitioners.serviceRemoved")}
                  >
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={assignment.id}
                    />
                    <input
                      type="hidden"
                      name="practitionerId"
                      value={practitionerId}
                    />
                    <button
                      type="submit"
                      className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      {t("practitioners.removeService")}
                    </button>
                  </ActionForm>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editor ? (
        <ServiceDialog
          practitionerId={practitionerId}
          state={editor}
          services={services}
          defaultDuration={defaultDuration}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </section>
  );
}

function ServiceDialog({
  practitionerId,
  state,
  services,
  defaultDuration,
  onClose,
}: {
  practitionerId: string;
  state: Exclude<EditorState, null>;
  services: Service[];
  defaultDuration: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const editing = state.mode === "edit";
  const assignment = editing ? state.assignment : null;

  const [serviceName, setServiceName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(
    String(assignment?.durationMinutes ?? defaultDuration),
  );
  const [price, setPrice] = useState(
    formatPriceInput(assignment?.priceCents ?? 0),
  );
  const [durationTouched, setDurationTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);

  const [error, formAction, pending] = useToastActionState(
    savePractitionerServiceAction,
    editing ? "Servicio actualizado" : "Servicio agregado",
    onClose,
  );

  return (
    <Modal
      title={editing ? t("practitioners.editService") : t("practitioners.addService")}
      description={t("practitioners.serviceEditHint")}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="practitionerId" value={practitionerId} />
        {assignment ? (
          <input type="hidden" name="assignmentId" value={assignment.id} />
        ) : null}

        {editing && assignment ? (
          <div className="rounded-xl border border-line bg-canvas px-3.5 py-3">
            <p className="text-sm font-semibold">{assignment.name}</p>
            <p className="text-xs text-muted">{assignment.code}</p>
          </div>
        ) : (
          <label className="space-y-1.5 text-sm font-medium">
            {t("practitioners.serviceName")} *
            <input
              name="serviceName"
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              onBlur={() => {
                if (editing) return;
                const match = services.find(
                  (service) =>
                    service.name.trim().toLowerCase() ===
                    serviceName.trim().toLowerCase(),
                );
                if (!match) return;
                if (!durationTouched) {
                  setDurationMinutes(String(match.durationMinutes));
                }
                if (!priceTouched) {
                  setPrice(formatPriceInput(match.priceCents));
                }
              }}
              className={inputClass}
              placeholder={t("practitioners.servicePlaceholder")}
              autoFocus
              required
            />
            <span className="block text-xs font-normal text-muted">
              {t("practitioners.serviceNameHint")}
            </span>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            {t("practitioners.duration")}
            <input
              type="number"
              name="durationMinutes"
              min={5}
              max={480}
              value={durationMinutes}
              onChange={(event) => {
                setDurationMinutes(event.target.value);
                setDurationTouched(true);
              }}
              className={inputClass}
              required
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            {t("practitioners.price")}
            <input
              type="number"
              name="price"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setPriceTouched(true);
              }}
              className={inputClass}
              required
            />
          </label>
        </div>

        <p className="rounded-xl bg-canvas px-3.5 py-3 text-xs text-muted">
          {t("practitioners.serviceHint")}
        </p>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-canvas"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={pending || (!editing && !serviceName.trim())}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {pending ? t("practitioners.saving") : t("availability.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
