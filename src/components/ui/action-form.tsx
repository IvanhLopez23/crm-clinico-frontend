"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Formulario para acciones simples (eliminar, activar) que muestra una
 * notificacion al terminar. Mantiene el envio sin recargar la pagina.
 */
export function ActionForm({
  action,
  successMessage,
  errorMessage = "No se pudo completar la acción.",
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult | void>;
  successMessage: string;
  errorMessage?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            const result = await action(formData);
            if (result && !result.ok) {
              toast.error(result.error || errorMessage);
              return;
            }
            toast.success(successMessage);
            router.refresh();
          } catch {
            toast.error(errorMessage);
          }
        });
      }}
    >
      {children}
    </form>
  );
}
