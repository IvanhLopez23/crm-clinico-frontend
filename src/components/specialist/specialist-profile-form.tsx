"use client";

import {
  Check,
  LoaderCircle,
  LogOut,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { updateMyProfileAction } from "@/app/actions/profile";
import { fileToAvatar } from "@/lib/avatar";
import { initials } from "@/lib/format";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";
import type { SessionUser } from "@/lib/session";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm";

export function SpecialistProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [avatarData, setAvatarData] = useState(user.avatarData ?? "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

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

  function submit() {
    setError(null);
    setSaved(false);
    if (!fullName.trim() || !email.trim()) {
      setError(t("validation.nameEmailRequired"));
      return;
    }
    if (password && password.length < 8) {
      setError(t("validation.passwordLength"));
      return;
    }

    startTransition(async () => {
      const result = await updateMyProfileAction({
        fullName,
        email,
        avatarData: avatarData || null,
        ...(password ? { password } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword("");
      setSaved(true);
      toast.success("Perfil actualizado correctamente");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-semibold text-brand-800">
            {avatarData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarData}
                alt={t("profile.photo")}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(fullName || email || "?")
            )}
          </span>
          <div>
            <p className="text-base font-semibold">{fullName}</p>
            <p className="text-xs text-muted">
              {t(`role.${user.role}` as "role.admin")}
            </p>
            <p className="mt-0.5 text-xs text-muted">{email}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="focus-ring inline-flex cursor-pointer items-center rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium hover:bg-canvas">
            {avatarBusy ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {avatarData ? "Cambiar foto" : "Agregar foto"}
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
              Quitar foto
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold">{t("profile.myData")}</h2>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            {t("profile.name")}
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            {t("profile.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            {t("profile.newPassword")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("profile.leaveBlank")}
              className={inputClass}
              autoComplete="new-password"
            />
            <span className="block text-xs font-normal text-muted">
              Mínimo 8 caracteres. Aplica al siguiente inicio de sesión.
            </span>
          </label>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check className="h-4 w-4" aria-hidden />
            Perfil actualizado.
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={pending || avatarBusy}
          className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {pending ? t("profile.saving") : t("profile.save")}
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
          {t("profile.account")}
        </h2>
        <p className="mt-2 text-xs text-muted">
          {t("profile.roleHint")}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          {t(`role.${user.role}` as "role.admin")}
        </p>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
