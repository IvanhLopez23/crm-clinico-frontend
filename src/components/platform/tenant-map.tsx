"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { useI18n } from "@/i18n/client";
import type { TenantSummary } from "@/lib/types";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function TenantMap({ tenants }: { tenants: TenantSummary[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const located = useMemo(
    () =>
      tenants.filter(
        (tenant) => tenant.latitude !== null && tenant.longitude !== null,
      ),
    [tenants],
  );
  const missing = tenants.length - located.length;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current || located.length === 0) return;

      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      mapRef.current?.remove();

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: OSM_ATTRIBUTION,
      }).addTo(map);

      const points: LatLngTuple[] = [];

      for (const tenant of located) {
        const point: LatLngTuple = [tenant.latitude!, tenant.longitude!];
        points.push(point);

        const marker = L.circleMarker(point, {
          radius: 8,
          color: "#0f766e",
          weight: 2,
          fillColor: "#14b8a6",
          fillOpacity: 0.9,
        }).addTo(map);

        const content = document.createElement("div");
        content.className = "space-y-1";

        const title = document.createElement("p");
        title.className = "font-semibold";
        title.textContent = tenant.name;
        content.append(title);

        const meta = document.createElement("p");
        meta.className = "text-xs text-muted";
        meta.textContent = `${tenant.timezone} · ${tenant.currency}`;
        content.append(meta);

        const link = document.createElement("a");
        link.href = `/platform/tenants/${tenant.id}`;
        link.className = "text-xs font-medium text-brand-700 underline";
        link.textContent = t("platform.openTenant");
        content.append(link);

        marker.bindPopup(content);
      }

      if (points.length === 1) {
        map.setView(points[0]!, 13);
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }

      requestAnimationFrame(() => map.invalidateSize());
    }

    void render();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [located, t]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("platform.mapTitle")}</h2>
          <p className="text-xs text-muted">{t("platform.mapHint")}</p>
        </div>
        <span className="text-xs text-muted">
          {located.length}/{tenants.length}
        </span>
      </div>

      <div className="p-4">
        {located.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-8 text-center text-sm text-muted">
            {t("platform.noCoordinates")}
          </p>
        ) : (
          <div
            ref={containerRef}
            className="relative z-0 h-[360px] w-full overflow-hidden rounded-xl border border-line"
          />
        )}

        {missing > 0 ? (
          <p className="mt-2 text-[11px] text-muted">
            {t("platform.missingCoordinates", { count: missing })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
