import { NextResponse } from "next/server";

const ASTRO_API_BASE = "https://json.freeastrologyapi.com";

// Temple location: Suwanee, GA
const TEMPLE_LAT = 34.0535;
const TEMPLE_LON = -84.0711;
const TEMPLE_TZ = "America/New_York";

if (!process.env.ASTRO_API_KEY) {
  throw new Error("ASTRO_API_KEY environment variable is not set");
}

const ASTRO_API_KEY = process.env.ASTRO_API_KEY;

/** Returns date/time parts in the temple's local timezone (ET). */
function getETTimeParts(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TEMPLE_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );

  return {
    year: parseInt(parts.year),
    month: parseInt(parts.month),
    date: parseInt(parts.day),
    hours: parseInt(parts.hour) % 24,
    minutes: parseInt(parts.minute),
    seconds: parseInt(parts.second),
  };
}

/** Returns the current UTC offset for ET (-4 EDT or -5 EST). */
function getETOffset(now: Date): number {
  const etMs = new Date(
    now.toLocaleString("en-US", { timeZone: TEMPLE_TZ })
  ).getTime();
  const utcMs = new Date(
    now.toLocaleString("en-US", { timeZone: "UTC" })
  ).getTime();
  return Math.round((etMs - utcMs) / (1000 * 60 * 60));
}

function buildPayload(now: Date) {
  return {
    ...getETTimeParts(now),
    latitude: TEMPLE_LAT,
    longitude: TEMPLE_LON,
    timezone: getETOffset(now),
    config: { observation_point: "topocentric", ayanamsha: "lahiri" },
  };
}

async function fetchAstro(endpoint: string, payload: object) {
  const res = await fetch(`${ASTRO_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ASTRO_API_KEY,
    },
    body: JSON.stringify(payload),
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  if (data.statusCode !== 200) throw new Error(`${endpoint} failed: ${data.message}`);
  return typeof data.output === "string" ? JSON.parse(data.output) : data.output;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TEMPLE_TZ,
  });
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

type HoraEntry = { lord: string; starts_at: string; ends_at: string };
type PlanetEntry = { name: string; current_sign: number };

export async function GET() {
  try {
    const now = new Date();
    const payload = buildPayload(now);

    const [rahuKalam, yamaGandam, gulikaKalam, amritKaal, horaTimings, planets] =
      await Promise.all([
        fetchAstro("rahu-kalam", payload),
        fetchAstro("yama-gandam", payload),
        fetchAstro("gulika-kalam", payload),
        fetchAstro("amrit-kaal", payload),
        fetchAstro("hora-timings", payload),
        fetchAstro("planets", payload),
      ]);

    const moonPlanet = Object.values(planets as Record<string, PlanetEntry>).find(
      (p) => p.name === "Moon"
    );

    const currentHora = Object.values(horaTimings as Record<string, HoraEntry>).find((h) => {
      const start = new Date(h.starts_at).getTime();
      const end = new Date(h.ends_at).getTime();
      return now.getTime() >= start && now.getTime() <= end;
    });

    return NextResponse.json({
      date: now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: TEMPLE_TZ,
      }),
      inauspicious: {
        rahuKalam: { label: "Rahu Kalam", start: formatTime(rahuKalam.starts_at), end: formatTime(rahuKalam.ends_at) },
        yamaGandam: { label: "Yama Gandam", start: formatTime(yamaGandam.starts_at), end: formatTime(yamaGandam.ends_at) },
        gulikaKalam: { label: "Gulika Kalam", start: formatTime(gulikaKalam.starts_at), end: formatTime(gulikaKalam.ends_at) },
      },
      auspicious: {
        amritKaal: { label: "Amrit Kaal", start: formatTime(amritKaal.starts_at), end: formatTime(amritKaal.ends_at) },
      },
      moonSign: moonPlanet ? SIGNS[moonPlanet.current_sign] : null,
      currentHora: currentHora?.lord ?? null,
    });
  } catch (error) {
    console.error("Panchang API error:", error);
    return NextResponse.json({ error: "Failed to fetch panchang" }, { status: 500 });
  }
}
