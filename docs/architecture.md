# Sai Sevak – Architecture Diagram

```mermaid
graph TB
    subgraph Browser["Browser (Visitor)"]
        UI["Page UI<br/>page.tsx"]
        CW["ChatWidget.tsx<br/>Chat Interface"]
        PW["PanchangWidget.tsx<br/>Daily Panchang"]
    end

    subgraph Netlify["Netlify (saibot-app.netlify.app)"]
        subgraph NextJS["Next.js App Router"]
            CHAT["/api/chat<br/>POST"]
            PANCH["/api/panchang<br/>GET"]
        end

        subgraph Knowledge["Knowledge Base (/knowledge)"]
            KT["temple-hours.ts"]
            KD["daily-services.ts"]
            KR["recurring-services.ts"]
            KW["weekly-programs.ts"]
            KC["contacts.ts"]
            KE["events-mar/apr/may-2026.ts"]
        end
    end

    subgraph External["External APIs"]
        CLAUDE["Anthropic Claude API<br/>claude-haiku-4-5"]
        ASTRO["Free Astrology API<br/>freeastrologyapi.com<br/>Rahu Kalam · Yama Gandam<br/>Gulika Kalam · Amrit Kaal<br/>Hora · Planets"]
    end

    subgraph Env["Environment Variables"]
        K1["ANTHROPIC_API_KEY"]
        K2["ASTRO_API_KEY"]
    end

    UI --> CW
    UI --> PW
    CW -->|"User message"| CHAT
    PW -->|"GET daily data"| PANCH

    Knowledge --> CHAT
    CHAT -->|"System prompt +<br/>conversation"| CLAUDE
    CLAUDE -->|"AI response"| CHAT
    CHAT -->|"Assistant reply"| CW

    PANCH -->|"Sequential calls<br/>300ms delay"| ASTRO
    ASTRO -->|"Timing data"| PANCH
    PANCH -->|"Formatted panchang"| PW

    K1 -.->|"injected"| CHAT
    K2 -.->|"injected"| PANCH
```

## Component Summary

| Layer | Component | Role |
|-------|-----------|------|
| **Frontend** | `ChatWidget` | Sends user messages, displays conversation |
| **Frontend** | `PanchangWidget` | Fetches and renders daily panchang on load |
| **API** | `/api/chat` | Builds system prompt from knowledge files, calls Claude, validates/trims messages |
| **API** | `/api/panchang` | Calls 6 astrology endpoints sequentially, formats ET timings |
| **Knowledge** | `/knowledge/*.ts` | Static temple data injected into Claude's system prompt at request time |
| **External** | Claude Haiku | Generates natural language responses |
| **External** | Free Astrology API | Provides Vedic astrology calculations for Suwanee GA location |
| **Infra** | Netlify | Hosts app, stores env secrets, serves serverless functions |

## Data Flow

### Chat
1. Visitor types a question in `ChatWidget`
2. `POST /api/chat` receives the message history
3. All knowledge files are compiled into the system prompt
4. Claude Haiku generates a response
5. Response is returned and displayed in the chat

### Panchang
1. `PanchangWidget` calls `GET /api/panchang` on page load
2. Server fetches 6 endpoints from freeastrologyapi.com sequentially
3. Times are formatted in America/New_York timezone
4. Widget displays inauspicious timings (red) and auspicious timings (green)
```
