"use client";

import { useActionState, useRef } from "react";
import { useToast } from "@/components/ui/toast-provider";

/**
 * Envuelve una accion de formulario basada en `useActionState` y muestra una
 * notificacion animada cuando la accion termina sin errores.
 */
export function useToastActionState(
  action: (previous: string | null, formData: FormData) => Promise<string | null>,
  successMessage: string,
  onSuccess?: () => void,
) {
  const toast = useToast();
  const successRef = useRef(onSuccess);
  successRef.current = onSuccess;

  return useActionState(async (previous: string | null, formData: FormData) => {
    const result = await action(previous, formData);
    if (result === null) {
      toast.success(successMessage);
      successRef.current?.();
    }
    return result;
  }, null as string | null);
}
