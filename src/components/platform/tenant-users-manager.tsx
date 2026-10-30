"use client";

import { LoaderCircle, Pencil, Plus, UserCheck, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTenantUserAction,
  toggleTenantUserAction,
  updateTenantUserAction,
} from "@/app/actions/platform";
import { Badge } from "@/components/ui/badge";
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
import { useToastActionState } from "@/lib/use-toast-action";
import type { TenantDetail, TenantUser } from "@/lib/types";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; user: TenantUser }
  | null;

export function TenantUsersManager({ tenant }: { tenant: TenantDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(user: TenantUser) {
    setPendingId(user.id);
    startTransition(async () => {
      const result = await toggleTenantUserAction(
        tenant.id,
        user.id,
        !user.isActive,
      );
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        user.isActive ? t("users.deactivatedToast") : t("users.reactivatedToast"),
      );
      router.refresh();
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("tenant.usersTitle")}</h2>
          <p className="text-xs text-muted">
            Altas, roles, contraseñas y estado de acceso.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setEditor({ mode: "create" })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t("tenant.newUser")}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">{t("tenant.user")}</th>
              <th className="px-5 py-2.5 font-medium">{t("tenant.role")}</th>
              <th className="px-5 py-2.5 font-medium">{t("tenant.specialist")}</th>
              <th className="px-5 py-2.5 font-medium">{t("tenant.lastAccess")}</th>
              <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
              <th className="px-5 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tenant.users.map((user) => (
              <tr key={user.id} className="hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td className="px-5 py-3">
                  <Badge variant="secondary">
                    {t(`role.${user.role}` as "role.admin")}
                  </Badge>
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
                    : t("tenant.never")}
                </td>
                <td className="px-5 py-3">
                  <Badge variant={user.isActive ? "success" : "destructive"}>
                    {user.isActive ? t("tenant.activeStatus") : t("tenant.inactiveStatus")}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditor({ mode: "edit", user })}
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                      {t("tenant.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === user.id}
                      onClick={() => toggle(user)}
                      className={
                        user.isActive
                          ? "text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      }
                    >
                      {pendingId === user.id ? (
                        <LoaderCircle
                          className="h-3 w-3 animate-spin"
                          aria-hidden
                        />
                      ) : user.isActive ? (
                        <UserX className="h-3 w-3" aria-hidden />
                      ) : (
                        <UserCheck className="h-3 w-3" aria-hidden />
                      )}
                      {user.isActive ? t("tenant.deactivate") : t("tenant.activate")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor ? (
        <TenantUserDialog
          tenant={tenant}
          state={editor}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </section>
  );
}

function TenantUserDialog({
  tenant,
  state,
  onClose,
}: {
  tenant: TenantDetail;
  state: Exclude<EditorState, null>;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const editing = state.mode === "edit";
  const user = editing ? state.user : null;
  const [role, setRole] = useState<TenantUser["role"]>(
    user?.role ?? "receptionist",
  );
  const [practitionerId, setPractitionerId] = useState(
    user?.practitionerId ?? "",
  );

  const [error, formAction, pending] = useToastActionState(
    editing ? updateTenantUserAction : createTenantUserAction,
    editing ? t("users.updatedToast") : t("users.createdToast"),
    () => {
      router.refresh();
      onClose();
    },
  );

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t("tenant.editUserTitle") : t("tenant.newUserTitle")}
          </DialogTitle>
          <DialogDescription>
            {tenant.name} · el correo debe ser único en toda la plataforma.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clinicId" value={tenant.id} />
          {user ? <input type="hidden" name="userId" value={user.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="platform-user-name">{t("tenant.fullName")}</Label>
            <Input
              id="platform-user-name"
              name="fullName"
              defaultValue={user?.fullName ?? ""}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform-user-email">{t("tenant.email")}</Label>
            <Input
              id="platform-user-email"
              name="email"
              type="email"
              defaultValue={user?.email ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform-user-password">
              {editing ? t("tenant.newPassword") : t("tenant.password")}
            </Label>
            <Input
              id="platform-user-password"
              name="password"
              type="password"
              minLength={8}
              required={!editing}
              placeholder={editing ? t("tenant.leaveBlank") : ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform-user-role">{t("tenant.role")}</Label>
              <input type="hidden" name="role" value={role} />
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as TenantUser["role"])
                }
              >
                <SelectTrigger id="platform-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("tenant.roleAdmin")}</SelectItem>
                  <SelectItem value="receptionist">{t("tenant.roleReception")}</SelectItem>
                  <SelectItem value="practitioner">{t("tenant.specialist")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-user-practitioner">{t("tenant.specialist")}</Label>
              <input
                type="hidden"
                name="practitionerId"
                value={role === "practitioner" ? practitionerId : ""}
              />
              <Select
                value={practitionerId}
                onValueChange={setPractitionerId}
                disabled={role !== "practitioner"}
              >
                <SelectTrigger id="platform-user-practitioner">
                  <SelectValue placeholder={t("tenant.noSpecialist")} />
                </SelectTrigger>
                <SelectContent>
                  {tenant.practitioners.map((practitioner) => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      {practitioner.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" disabled={pending}>
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {pending ? t("tenant.savingUser") : t("tenant.saveUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
