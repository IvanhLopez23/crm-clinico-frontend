"use client";

import { LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  acceptWaitlistOfferAction,
  cancelReminderAction,
  cancelWaitlistEntryAction,
  declineWaitlistOfferAction,
  retryReminderAction,
} from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";

export function ReminderActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const canCancel = status === "pending" || status === "failed";
  const canRetry = status === "failed" || status === "cancelled";
  if (!canCancel && !canRetry) return null;

  function run(kind: "cancel" | "retry") {
    startTransition(async () => {
      const result =
        kind === "cancel"
          ? await cancelReminderAction(id)
          : await retryReminderAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        kind === "cancel" ? t("messages.reminderCancelled") : t("messages.reminderRetried"),
      );
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      {canRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run("retry")}
        >
          {pending ? (
            <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="h-3 w-3" aria-hidden />
          )}
          {t("messages.retry")}
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run("cancel")}
          className="text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          {t("messages.cancel")}
        </Button>
      ) : null}
    </div>
  );
}

export function WaitlistEntryActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  if (status !== "waiting" && status !== "offered") return null;

  function cancel() {
    startTransition(async () => {
      const result = await cancelWaitlistEntryAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("messages.entryCancelled"));
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={cancel}
        className="text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        {pending ? (
          <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="h-3 w-3" aria-hidden />
        )}
        {t("messages.remove")}
      </Button>
    </div>
  );
}

export function WaitlistOfferActions({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function run(kind: "accept" | "decline") {
    startTransition(async () => {
      const result =
        kind === "accept"
          ? await acceptWaitlistOfferAction(id)
          : await declineWaitlistOfferAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        kind === "accept" ? t("messages.offerAccepted") : t("messages.offerDeclined"),
      );
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("decline")}
      >
        {t("messages.decline")}
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => run("accept")}
      >
        {pending ? (
          <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
        ) : null}
        {t("messages.accept")}
      </Button>
    </div>
  );
}
