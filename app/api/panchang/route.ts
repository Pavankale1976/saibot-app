import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ASTRO_API_BASE = "https://json.freeastrologyapi.com";
const TEMPLE_LAT = 34.0535;
const TEMPLE_LON = -84.0711;
const TEMPLE_TZ = "America/New_York";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

type HoraEntry = { lord: string; starts_at: string; ends_at: string };
type PlanetEntry = { name: string; current_sign: number };

/** Returns ET date/time parts using Intl — works correctly regardless of server timezone. */
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

/** Returns the current UTC offset for ET using Intl (-4 EDT or -5 EST). */
function getETOffset(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEMPLE_TZ,
    timeZoneName: "shortOffset",
  }).formatToParts(now);

  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = tzName.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1]) : -5;
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

async function fetchAstro(endpoint: string, payload: object, apiKey: string) {
  const res = await fetch(`${ASTRO_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${endpoint} HTTP ${res.status}`);

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

export async function GET() {
  const apiKey = process.env.ASTRO_API_KEY;
  if (!apiKey) {
    console.error("ASTRO_API_KEY is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const now = new Date();
    const payload = buildPayload(now);

    const [rahuKalam, yamaGandam, gulikaKalam, amritKaal, horaTimings, planets] =
      await Promise.all([
        fetchAstro("rahu-kalam", payload, apiKey),
        fetchAstro("yama-gandam", payload, apiKey),
        fetchAstro("gulika-kalam", payload, apiKey),
        fetchAstro("amrit-kaal", payload, apiKey),
        fetchAstro("hora-timings", payload, apiKey),
        fetchAstro("planets", payload, apiKey),
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Panchang API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
