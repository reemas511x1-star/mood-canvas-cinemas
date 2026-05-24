## Goal
Expand the mood system into two distinct modes and switch the AI backend to Groq (`llama-3.3-70b-versatile`).

## 1. Two mood modes

Add a top-level toggle in the Navbar mood menu: **Manual** ("مودي أنا") vs **Auto from writing** ("مود مزاجي").

### Manual themes (10) — `MoodPreset` rewrite
Each is a full visual identity (gradient, particle/ambient effect, accent color, vibe):

| Key | Name | Visual |
|---|---|---|
| midnight | Midnight | deep black + slow starfield |
| ember | Ember | warm orange radial + floating embers |
| forest | Forest | dark green + drifting leaves |
| cosmic | Cosmic | purple/blue + nebula particles |
| sand | Sand | beige desert + slow dunes shimmer |
| arctic | Arctic | white/icy blue + snow drift |
| sakura | Sakura | soft pink + falling petals |
| storm | Storm | dark gray + rain + occasional flash |
| gold | Gold | gold/black + slow glints |
| void | Void | pure black, no particles |

These replace the current 6 `masculine-dark`/`light`/... presets. Migration: any old stored preset maps to `midnight`.

The existing `weather` overlay system stays available only in Manual mode (kept simple — same dropdown), since several manual themes already imply weather.

### Auto-detect themes (10) — new `AutoMood`
Triggered by analyzing the user's recent text input (search queries, notes on watch items, AI mood-recommendation prompt). 10 moods:
happy, sad, anxious, angry, excited, tired, lost, grateful, tense, ok — each with its own gradient + particle behavior matching the brief.

A small text box ("How are you feeling? / كيف حالك؟") appears in the mood menu when Auto mode is active. On submit → call Groq classifier → set `autoMood` → background updates.

### Implementation files
- `src/components/MoodBackground.tsx` — rewrite preset gradients + particle switch to cover all 20 themes.
- `src/contexts/AppContext.tsx` — add `moodMode: "manual" | "auto"`, rename type, add `autoMood`, persist all three.
- `src/components/Navbar.tsx` — new mood menu with mode toggle, manual grid, auto text input.
- DB migration: `user_preferences` add `mood_mode text`, `auto_mood text`; expand allowed values (no enum constraint currently — just text — so additive only).

## 2. Groq AI backend

Replace Lovable AI Gateway calls with Groq.

- Add `GROQ_API_KEY` secret (request via add_secret).
- `src/lib/ai.functions.ts`:
  - `getMoodRecommendations` → call `https://api.groq.com/openai/v1/chat/completions` with `model: "llama-3.3-70b-versatile"`.
  - New `detectMood` server fn: input free text → returns one of the 10 auto moods (tool-calling for structured output).
- Keep the rest of the recommendation logic (history-aware, JSON response, 6 picks).

## 3. Out of scope
- No changes to TMDB, watch list, stats, auth.
- Keep `weather` only for Manual mode (no removal — backward compatible).

## Technical notes
- 10 manual themes need 10 gradient strings + 10 particle behaviors in the canvas. I'll reuse existing rain/snow/cloud particle code where it maps (storm=rain+thunder, arctic=snow, sakura=petals like autumn-leaves with pink, forest=leaves green).
- Auto-detect uses Groq tool-calling to force one-of-10 output; falls back to `ok` on parse failure.
- All AI calls remain server-side via `createServerFn` with `requireSupabaseAuth`.
