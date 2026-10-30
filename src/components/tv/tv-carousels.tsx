"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  ExternalLink,
  Newspaper,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  weatherKey,
  type NewsItem,
  type WeatherData,
} from "@/lib/tv-content";
import { useI18n } from "@/i18n/client";

export function WeatherToday({ weather }: { weather: WeatherData }) {
  const { t } = useI18n();
  const today = weather.days[0];
  const Icon = weatherIcon(weather.current.code);

  return (
    <section aria-label={t("tv.weatherToday")} className="card flex h-full flex-col p-4">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Thermometer className="h-3.5 w-3.5" aria-hidden />
        {t("tv.weather")} · {weather.city}
      </p>

      <div className="mt-2 flex flex-1 items-center gap-3">
        <Icon className="h-9 w-9 shrink-0 text-brand-600" aria-hidden />
        <div className="min-w-0">
          <p className="text-3xl font-semibold tabular-nums">
            {weather.current.temperature}°
          </p>
          <p className="mt-0.5 text-xs font-medium">
            {t(weatherKey(weather.current.code))}
          </p>
        </div>
        <div className="ml-auto space-y-0.5 text-right text-[11px] text-muted">
          {today ? (
            <p>
              {t("tv.max")} {today.max}° · {t("tv.min")} {today.min}°
            </p>
          ) : null}
          <p className="inline-flex items-center gap-1">
            <Droplets className="h-3 w-3" aria-hidden />
            {weather.current.humidity}%
          </p>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
        <Wind className="h-3 w-3" aria-hidden />
        {t("tv.wind")} {weather.current.wind} km/h · {t("tv.feelsLike")}{" "}
        {weather.current.feelsLike}°
      </p>
    </section>
  );
}

export function NewsCarousel({ items }: { items: NewsItem[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const item = items[index % items.length];
  if (!item) return null;

  return (
    <section
      aria-label={t("tv.news")}
      className="card flex h-full flex-col p-4 sm:p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <Newspaper className="h-4 w-4" aria-hidden />
          {t("tv.news")}
        </p>
        <span className="text-[11px] text-muted">
          {index + 1} / {items.length}
        </span>
      </div>

      <div key={item.title} className="carousel-item mt-3 flex-1">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="focus-ring group block text-xl font-semibold leading-snug hover:text-brand-800 sm:text-2xl"
          >
            <span className="line-clamp-3">{item.title}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
              {t("tv.readMore")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </span>
          </a>
        ) : (
          <p className="line-clamp-3 text-xl font-semibold leading-snug sm:text-2xl">
            {item.title}
          </p>
        )}
      </div>

      {items.length > 1 ? (
        <Dots
          count={items.length}
          index={index % items.length}
          onSelect={setIndex}
          label={t("tv.headlines")}
        />
      ) : null}
    </section>
  );
}

function Dots({
  count,
  index,
  onSelect,
  label,
}: {
  count: number;
  index: number;
  onSelect: (index: number) => void;
  label: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label={label}>
      {Array.from({ length: count }).map((_, position) => (
        <button
          key={position}
          type="button"
          onClick={() => onSelect(position)}
          aria-label={`${label} ${position + 1}`}
          aria-current={position === index ? "true" : undefined}
          className={`focus-ring h-1.5 rounded-full transition-all ${
            position === index
              ? "w-6 bg-brand-600"
              : "w-1.5 bg-line hover:bg-brand-300"
          }`}
        />
      ))}
    </div>
  );
}

function weatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Wind;
}
