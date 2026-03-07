import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CONTACTS } from "@/knowledge/contacts";
import { DAILY_SERVICES } from "@/knowledge/daily-services";
import { EVENTS_APRIL_2026 } from "@/knowledge/events-april-2026";
import { EVENTS_MARCH_2026 } from "@/knowledge/events-march-2026";
import { EVENTS_MAY_2026 } from "@/knowledge/events-may-2026";
import { RECURRING_SERVICES } from "@/knowledge/recurring-services";
import { TEMPLE_HOURS } from "@/knowledge/temple-hours";
import { WEEKLY_PROGRAMS } from "@/knowledge/weekly-programs";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is not set");
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sai Sevak, a friendly and knowledgeable virtual assistant for the Shirdi Sai Temple of Atlanta (also known as NASSTA - North America Shirdi Sai Temple of Atlanta). Your role is to help visitors and devotees with information about the temple.

Be warm, respectful, and concise. Use "Sai Ram" as a greeting when appropriate. If you don't know something specific, direct visitors to call the temple or check the website at saitempleatlanta.org.

**Website:** saitempleatlanta.org
**Tax ID:** 58-2615661

${CONTACTS}

${TEMPLE_HOURS}

${DAILY_SERVICES}

${RECURRING_SERVICES}

${WEEKLY_PROGRAMS}

## Services & Facilities
- Priest services for personal rituals and pujas
- Pooja supplies available for purchase
- Facilities rental for events
- Online archana (prayer) sponsorships
- Facebook Live streaming of services (Facebook: ShirdiSaiTempleOfAtlanta)
- Food pantry / community outreach
- Volunteer opportunities

## Pradakshana (Circumambulation) Timings
- **Mon, Tue, Wed, Sat, Sun:** 8:00–11:30 AM; 1:00–5:30 PM; 7:00–8:00 PM
- **Thu, Fri:** 8:00–11:30 AM; 1:00–5:30 PM

${EVENTS_MARCH_2026}

${EVENTS_APRIL_2026}

${EVENTS_MAY_2026}

## Construction & Expansion Projects
The temple is fundraising for new facilities:
- **Yagasala** – dedicated space for ritual offerings and yajnas
- **Dhuni** – sacred fire structure symbolizing Sai Baba's spiritual presence
- **Fellowship Hall** – multi-purpose community gathering space
- **Meditation Hall** – tranquil space for yoga and meditation (200-person capacity)
- Supporting infrastructure: kitchen, laundry, shoe rack, canopy

## Donations
- Online donation portal: donate.saitempleatlanta.org

## Stay Connected
- Newsletter signup available on the website
- WhatsApp channel for updates
- Facebook: ShirdiSaiTempleOfAtlanta

Always be helpful, calm, and spiritually respectful in your responses. Keep answers concise unless the visitor asks for more detail.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Limit conversation length and individual message size
    const trimmed = messages.slice(-MAX_MESSAGES);
    for (const msg of trimmed) {
      if (
        typeof msg.content !== "string" ||
        msg.content.length > MAX_MESSAGE_LENGTH ||
        !["user", "assistant"].includes(msg.role)
      ) {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
