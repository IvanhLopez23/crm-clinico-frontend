"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { useI18n } from "@/i18n/client";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, null);
  const { t } = useI18n();

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          {t("login.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="admin@clinica.com"
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          {t("login.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm placeholder:text-slate-400"
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

      <button
        type="submit"
        disabled={pending}
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {pending ? t("login.submitting") : t("login.submit")}
      </button>

      <p className="text-center text-xs text-muted">
        {t("login.footer")}
      </p>
    </form>
  );
}
