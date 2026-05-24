import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const MANUAL_MOOD_DESC: Record<string, string> = {
  midnight: "deep midnight, calm, starry, contemplative",
  ember: "warm fireside, intimate, glowing",
  forest: "natural, grounded, mossy and green",
  cosmic: "vast, dreamy, sci-fi cosmic wonder",
  sand: "warm desert, slow, golden",
  arctic: "crisp, clean, icy clarity",
  sakura: "soft pink, tender, Japanese, gentle",
  storm: "dramatic, dark, rainy and intense",
  gold: "luxurious, classic, elegant",
  void: "minimal, austere, pure black silence",
};

const AUTO_MOOD_DESC: Record<string, string> = {
  happy: "joyful, bright, uplifting",
  sad: "tender, melancholic, soft",
  anxious: "soothing, minimal, calming",
  angry: "intense, cathartic",
  excited: "vibrant, kinetic, thrilling",
  tired: "gentle, low-energy, comforting",
  lost: "introspective, atmospheric, searching",
  grateful: "warm, hopeful, heartfelt",
  tense: "cool, composed, easing",
  ok: "balanced, easy, comfortable",
};

const AUTO_MOOD_KEYS = [
  "happy","sad","anxious","angry","excited","tired","lost","grateful","tense","ok",
] as const;
type AutoMoodKey = typeof AUTO_MOOD_KEYS[number];

async function callGroq(body: Record<string, unknown>) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export const getMoodRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mood: string; weather?: string | null; language?: "en" | "ar" }) =>
    z.object({
      mood: z.string().min(1).max(40),
      weather: z.string().min(1).max(40).nullable().optional(),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: items } = await supabase
      .from("watch_items")
      .select("title, status, user_rating, genres, media_type")
      .order("updated_at", { ascending: false })
      .limit(40);

    const watchedSummary = (items ?? [])
      .filter((i: any) => i.status === "watched")
      .slice(0, 25)
      .map((i: any) => `${i.title}${i.user_rating ? ` (★${i.user_rating})` : ""}`)
      .join(", ") || "no history yet";

    const moodText =
      MANUAL_MOOD_DESC[data.mood] ?? AUTO_MOOD_DESC[data.mood] ?? data.mood;
    const weatherText = data.weather ? ` The weather mood is ${data.weather}.` : "";
    const langName = data.language === "ar" ? "Arabic" : "English";

    const sys = `You are a cinematic taste curator. Reply ONLY with strict JSON of shape:
{"picks":[{"title":string,"year":number|null,"type":"movie"|"tv","why":string}]}
Return EXACTLY 6 picks. "why" is one short sentence in ${langName}. No prose, no markdown.`;

    const userMsg = `User mood: ${moodText}.${weatherText}
Recently watched: ${watchedSummary}.
Suggest 6 widely-available titles (mix movies, series, anime). Avoid duplicates of recently watched.`;

    const j = await callGroq({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    let parsed: { picks?: unknown };
    try { parsed = JSON.parse(raw); } catch { parsed = { picks: [] }; }
    const picks = Array.isArray(parsed.picks) ? (parsed.picks as unknown[]).slice(0, 6) : [];
    return { picks };
  });

export const detectMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; language?: "en" | "ar" }) =>
    z.object({
      text: z.string().min(1).max(2000),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<{ mood: AutoMoodKey }> => {
    const sys = `You are an emotion classifier. Given a short user message (English or Arabic), classify it into EXACTLY ONE of these mood labels: ${AUTO_MOOD_KEYS.join(", ")}.
Reply ONLY with JSON: {"mood":"<label>"}. No prose.`;
    const j = await callGroq({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: data.text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    let mood: AutoMoodKey = "ok";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.mood === "string" && (AUTO_MOOD_KEYS as readonly string[]).includes(parsed.mood)) {
        mood = parsed.mood as AutoMoodKey;
      }
    } catch { /* fallback ok */ }
    return { mood };
  });