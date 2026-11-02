"use client";

import {
  Download,
  FileText,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTenantContractAction,
  uploadTenantContractAction,
} from "@/app/actions/platform";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { useToastActionState } from "@/lib/use-toast-action";
import type { TenantContract } from "@/lib/types";

type ContractStatus = "active" | "expired" | "inactive";

export function TenantContractsManager({
  tenantId,
  contracts,
}: {
  tenantId: string;
  contracts: TenantContract[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, formAction, pending] = useToastActionState(
    uploadTenantContractAction,
    t("platform.contractUploaded"),
    () => {
      formRef.current?.reset();
      detailsRef.current?.removeAttribute("open");
      router.refresh();
    },
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="contracts" className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("platform.contractsTitle")}</h2>
          <p className="text-xs text-muted">{t("platform.contractsHint")}</p>
        </div>
        <span className="text-xs text-muted">
          {t("platform.contractsCount", { count: contracts.length })}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {contracts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-8 text-center text-sm text-muted">
            {t("platform.contractsEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {contracts.map((contract) => {
              const status = statusOf(contract, today);
              return (
                <li
                  key={contract.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {contract.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}
                        >
                          {t(STATUS_LABEL[status])}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {contract.fileName} · {formatBytes(contract.sizeBytes)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDateOnly(contract.startsAt, locale)} –{" "}
                        {contract.endsAt
                          ? formatDateOnly(contract.endsAt, locale)
                          : t("platform.contractNoEnd")}
                      </p>
                      {contract.notes ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {contract.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/platform/tenants/${tenantId}/contracts/${contract.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                    >
                      <Download className="h-3 w-3" aria-hidden />
                      {t("platform.contractDownload")}
                    </a>
                    <ActionForm
                      action={deleteTenantContractAction}
                      successMessage={t("platform.contractDeleted")}
                    >
                      <input type="hidden" name="clinicId" value={tenantId} />
                      <input
                        type="hidden"
                        name="contractId"
                        value={contract.id}
                      />
                      <button
                        type="submit"
                        className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                        {t("platform.contractDelete")}
                      </button>
                    </ActionForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <details
          ref={detailsRef}
          className="rounded-xl border border-line bg-surface"
        >
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-800">
            <Plus className="h-4 w-4" aria-hidden />
            {t("platform.contractUpload")}
          </summary>
          <form
            ref={formRef}
            action={formAction}
            className="space-y-4 border-t border-line p-3"
          >
            <input type="hidden" name="clinicId" value={tenantId} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contract-name">
                  {t("platform.contractName")} *
                </Label>
                <Input
                  id="contract-name"
                  name="name"
                  placeholder="Licencia anual 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-startsAt">
                  {t("platform.contractStart")} *
                </Label>
                <Input
                  id="contract-startsAt"
                  name="startsAt"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-endsAt">
                  {t("platform.contractEnd")}
                </Label>
                <Input id="contract-endsAt" name="endsAt" type="date" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contract-file">
                  {t("platform.contractFile")} *
                </Label>
                <Input
                  id="contract-file"
                  name="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  required
                />
                <p className="text-[11px] text-muted">
                  {t("platform.contractFileHint")}
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contract-notes">
                  {t("platform.contractNotes")}
                </Label>
                <Input id="contract-notes" name="notes" />
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-xs text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                )}
                {pending
                  ? t("platform.contractUploading")
                  : t("platform.contractUpload")}
              </Button>
            </div>
          </form>
        </details>
      </div>
    </section>
  );
}

const STATUS_CLASS: Record<ContractStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  inactive: "bg-slate-100 text-slate-700 ring-slate-200",
};

const STATUS_LABEL = {
  active: "platform.contractActive",
  expired: "platform.contractExpired",
  inactive: "platform.contractInactive",
} as const;

function statusOf(contract: TenantContract, today: string): ContractStatus {
  if (!contract.isActive) return "inactive";
  if (contract.endsAt && contract.endsAt < today) return "expired";
  return "active";
}

function formatDateOnly(value: string, locale: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    locale === "en" ? "en-US" : "es-MX",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
