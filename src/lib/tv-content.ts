const TZ_LOCATIONS: Record<
  string,
  { city: string; latitude: number; longitude: number }
> = {
  "America/Mexico_City": {
    city: "Ciudad de México",
    latitude: 19.4326,
    longitude: -99.1332,
  },
  "America/Monterrey": {
    city: "Monterrey",
    latitude: 25.6866,
    longitude: -100.3161,
  },
  "America/Cancun": { city: "Cancún", latitude: 21.1619, longitude: -86.8515 },
  "America/Tijuana": { city: "Tijuana", latitude: 32.5149, longitude: -117.0382 },
  "America/Chihuahua": {
    city: "Chihuahua",
    latitude: 28.6353,
    longitude: -106.0889,
  },
  "America/Merida": { city: "Mérida", latitude: 20.9674, longitude: -89.5926 },
  "America/Hermosillo": {
    city: "Hermosillo",
    latitude: 29.0729,
    longitude: -110.9559,
  },
  "America/Bogota": { city: "Bogotá", latitude: 4.711, longitude: -74.0721 },
  "America/Lima": { city: "Lima", latitude: -12.0464, longitude: -77.0428 },
  "America/Santiago": {
    city: "Santiago",
    latitude: -33.4489,
    longitude: -70.6693,
  },
  "America/Argentina/Buenos_Aires": {
    city: "Buenos Aires",
    latitude: -34.6037,
    longitude: -58.3816,
  },
  "America/New_York": {
    city: "Nueva York",
    latitude: 40.7128,
    longitude: -74.006,
  },
  "America/Los_Angeles": {
    city: "Los Ángeles",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  "Europe/Madrid": { city: "Madrid", latitude: 40.4168, longitude: -3.7038 },
};

export type WeatherDay = {
  date: string;
  code: number;
  max: number;
  min: number;
};

export type WeatherData = {
  city: string;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    wind: number;
    code: number;
  };
  days: WeatherDay[];
};

export type NewsItem = {
  title: string;
  link: string;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

export type WeatherLabelKey =
  | "tv.clear"
  | "tv.partlyCloudy"
  | "tv.cloudy"
  | "tv.fog"
  | "tv.drizzle"
  | "tv.rain"
  | "tv.snow"
  | "tv.showers"
  | "tv.storm"
  | "tv.variable";

export function weatherKey(code: number): WeatherLabelKey {
  if (code === 0) return "tv.clear";
  if (code <= 2) return "tv.partlyCloudy";
  if (code === 3) return "tv.cloudy";
  if (code === 45 || code === 48) return "tv.fog";
  if (code >= 51 && code <= 57) return "tv.drizzle";
  if (code >= 61 && code <= 67) return "tv.rain";
  if (code >= 71 && code <= 77) return "tv.snow";
  if (code >= 80 && code <= 82) return "tv.showers";
  if (code >= 85 && code <= 86) return "tv.snow";
  if (code >= 95) return "tv.storm";
  return "tv.variable";
}

export async function getWeather(timezone: string): Promise<WeatherData | null> {
  const location =
    TZ_LOCATIONS[timezone] ??
    TZ_LOCATIONS["America/Mexico_City"]!;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}` +
      `&longitude=${location.longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&forecast_days=1&timezone=auto";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 900 },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;
    const daily = data.daily;
    if (!current || !daily?.time) return null;

    const days = daily.time.slice(0, 4).map((date, index) => ({
      date,
      code: daily.weather_code?.[index] ?? 0,
      max: Math.round(daily.temperature_2m_max?.[index] ?? 0),
      min: Math.round(daily.temperature_2m_min?.[index] ?? 0),
    }));

    return {
      city: location.city,
      current: {
        temperature: Math.round(current.temperature_2m ?? 0),
        feelsLike: Math.round(current.apparent_temperature ?? 0),
        humidity: Math.round(current.relative_humidity_2m ?? 0),
        wind: Math.round(current.wind_speed_10m ?? 0),
        code: current.weather_code ?? 0,
      },
      days,
    };
  } catch {
    return null;
  }
}

const NEWS_FEEDS = [
  "https://news.google.com/rss?hl=es-419&gl=MX&ceid=MX:es-419",
  "https://feeds.bbci.co.uk/mundo/rss.xml",
];

export async function getNews(): Promise<NewsItem[]> {
  for (const feed of NEWS_FEEDS) {
    try {
      const response = await fetch(feed, {
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 600 },
        headers: {
          accept: "application/rss+xml, application/xml, text/xml",
          "user-agent": "AuroraCRM/1.0",
        },
      });
      if (!response.ok) continue;

      const xml = await response.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
        .slice(0, 8)
        .map((match) => {
          const block = match[1] ?? "";
          const title = decodeXml(
            block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "",
          );
          const link = decodeXml(
            block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "",
          );
          return { title, link };
        })
        .filter((item) => item.title.length > 0);

      if (items.length > 0) return items;
    } catch {
      // Si el servidor no tiene salida a ese feed, se intenta el siguiente.
    }
  }
  return [];
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/\s+/g, " ")
    .trim();
}
