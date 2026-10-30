"use client";

import {
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createUserAction,
  deactivateUserAction,
  updateUserAction,
} from "@/app/actions/users";
import { initials } from "@/lib/format";
import { fileToAvatar } from "@/lib/avatar";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";
import type { Practitioner, SystemUser } from "@/lib/types";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; user: SystemUser }
  | null;

export function UsersManager({
  users,
  practitioners,
  currentUserId,
}: {
  users: SystemUser[];
  practitioners: Practitioner[];
  currentUserId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorState>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleActive(user: SystemUser) {
    if (user.id === currentUserId) return;
    setError(null);
    setPendingId(user.id);
    startTransition(async () => {
      const result = user.isActive
        ? await deactivateUserAction(user.id)
        : await updateUserAction({ id: user.id, isActive: true });
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        user.isActive ? t("users.deactivatedToast") : t("users.reactivatedToast"),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {users.filter((user) => user.isActive).length} activos ·{" "}
          {users.length} en total
        </p>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("users.new")}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">{t("users.user")}</th>
                <th className="px-5 py-2.5 font-medium">{t("users.role")}</th>
                <th className="px-5 py-2.5 font-medium">{t("users.specialist")}</th>
                <th className="px-5 py-2.5 font-medium">{t("users.lastAccess")}</th>
                <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
                <th className="px-5 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                          {user.avatarData ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarData}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(user.fullName)
                          )}
                        </span>
                        <div>
                          <p className="font-medium">
                            {user.fullName}
                            {isSelf ? (
                              <span className="ml-2 text-[10px] font-medium text-brand-700">
                                tú
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
                        {user.role === "admin" ? (
                          <ShieldCheck className="h-3 w-3" aria-hidden />
                        ) : null}
                        {t(`role.${user.role}` as "role.admin")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {user.practitionerName ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : t("users.never")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                            : "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {user.isActive ? t("users.active") : t("users.inactive")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditor({ mode: "edit", user })}
                          className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
                        >
                          <Pencil className="h-3 w-3" aria-hidden />
                          {t("users.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(user)}
                          disabled={isSelf || pendingId === user.id}
                          className={`focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                            user.isActive
                              ? "text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          {pendingId === user.id ? (
                            <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
                          ) : user.isActive ? (
                            <UserX className="h-3 w-3" aria-hidden />
                          ) : (
                            <UserCheck className="h-3 w-3" aria-hidden />
                          )}
                          {user.isActive ? t("users.deactivate") : t("users.activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editor ? (
        <UserEditor
          state={editor}
          practitioners={practitioners}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </div>
  );
}

function UserEditor({
  state,
  practitioners,
  onClose,
}: {
  state: Exclude<EditorState, null>;
  practitioners: Practitioner[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const editing = state.mode === "edit";
  const user = editing ? state.user : null;

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [avatarData, setAvatarData] = useState(user?.avatarData ?? "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [role, setRole] = useState<SystemUser["role"]>(
    user?.role ?? "receptionist",
  );
  const [practitionerId, setPractitionerId] = useState(
    user?.practitionerId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError(t("validation.nameEmailRequired"));
      return;
    }
    if (!editing && password.length < 8) {
      setError(t("validation.passwordLength"));
      return;
    }
    if (role === "practitioner" && !practitionerId) {
      setError(t("users.selectSpecialistError"));
      return;
    }

    startTransition(async () => {
      const result = editing && user
        ? await updateUserAction({
            id: user.id,
            fullName,
            email,
            avatarData: avatarData || null,
            role,
            practitionerId: role === "practitioner" ? practitionerId : null,
            ...(password ? { password } : {}),
          })
        : await createUserAction({
            fullName,
            email,
            password,
            avatarData: avatarData || null,
            role,
            practitionerId: role === "practitioner" ? practitionerId : null,
          });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(editing ? t("users.updatedToast") : t("users.createdToast"));
      onClose();
      router.refresh();
    });
  }

  async function handleAvatar(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("validation.imageTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("validation.imageSizeError"));
      return;
    }

    setAvatarBusy(true);
    try {
      setAvatarData(await fileToAvatar(file));
    } catch {
      setError(t("validation.imageProcessError"));
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 dark:bg-black/60">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? t("users.editTitle") : t("users.newTitle")}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
          <div>
            <p className="text-xs text-muted">{t("tenant.settings")}</p>
            <h2 className="mt-0.5 text-lg font-semibold">
              {editing ? t("users.editTitle") : t("users.newTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-canvas p-4 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-base font-semibold text-brand-800">
              {avatarData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarData}
                  alt={t("users.preview")}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(fullName || email || "?")
              )}
            </span>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("users.photo")}</p>
              <p className="text-xs text-muted">
                Opcional. Se recorta a 256×256 y se guarda comprimida.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="focus-ring inline-flex cursor-pointer items-center rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:bg-canvas">
                  {avatarBusy ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {avatarData ? t("users.changePhoto") : t("users.addPhoto")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => handleAvatar(event.target.files?.[0])}
                  />
                </label>
                {avatarData ? (
                  <button
                    type="button"
                    onClick={() => setAvatarData("")}
                    className="text-xs font-medium text-rose-700 hover:underline"
                  >
                    {t("users.removePhoto")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              {t("users.fullName")}
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              {t("users.email")}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium">
            {editing ? t("users.newPassword") : t("users.password")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={editing ? t("users.leaveBlank") : t("users.passwordHint")}
              className={inputClass}
              autoComplete="new-password"
            />
            <span className="block text-xs font-normal text-muted">
              {editing
                ? t("users.passwordEditHint")
                : t("users.passwordHint")}
            </span>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Rol
              <select
                value={role}
                onChange={(event) => {
                  const next = event.target.value as SystemUser["role"];
                  setRole(next);
                  if (next !== "practitioner") setPractitionerId("");
                }}
                className={inputClass}
              >
                <option value="admin">{t("users.roleAdmin")}</option>
                <option value="practitioner">{t("users.specialist")}</option>
                <option value="receptionist">{t("users.roleReception")}</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              {t("users.assignSpecialist")}
              <select
                value={practitionerId}
                onChange={(event) => setPractitionerId(event.target.value)}
                disabled={role !== "practitioner"}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">{t("users.noSpecialist")}</option>
                {practitioners.map((practitioner) => (
                  <option key={practitioner.id} value={practitioner.id}>
                    {practitioner.fullName}
                  </option>
                ))}
              </select>
              <span className="block text-xs font-normal text-muted">
                {t("users.specialistRequiredHint")}
              </span>
            </label>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {editing ? t("users.saveChanges") : t("users.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

