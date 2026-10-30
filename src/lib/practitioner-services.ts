import type { PractitionerService, Service } from "@/lib/types";

/**
 * Servicios que puede ofrecer un especialista. Si no tiene asignaciones
 * propias se usa el catalogo base (compatibilidad con datos antiguos).
 */
export function servicesForPractitioner(
  practitionerId: string,
  services: Service[],
  practitionerServices: PractitionerService[],
): Service[] {
  const rows = practitionerServices.filter(
    (item) => item.practitionerId === practitionerId,
  );
  if (rows.length === 0) return services;

  return rows
    .filter((item) => item.isActive)
    .flatMap((assignment) => {
      const base = services.find((service) => service.id === assignment.serviceId);
      if (!base) return [];
      return [
        {
          ...base,
          name: assignment.name,
          durationMinutes: assignment.durationMinutes,
          priceCents: assignment.priceCents,
          currency: assignment.currency,
        },
      ];
    });
}
