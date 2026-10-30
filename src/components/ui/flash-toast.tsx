"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

/**
 * Muestra una notificacion despues de una redireccion (por ejemplo tras crear
 * un paciente o un especialista) y limpia el parametro de la URL.
 */
export function FlashToast({
  message,
  cleanPath,
}: {
  message: string;
  cleanPath: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    toast.success(message);
    router.replace(cleanPath, { scroll: false });
  }, [cleanPath, message, router, toast]);

  return null;
}
