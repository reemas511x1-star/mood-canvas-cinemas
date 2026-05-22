import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MOOD_PROMPT: Record<string, string> = {
  "masculine-dark": "dark, intense, brooding, masculine energy",
  "light": "uplifting, warm, optimistic, daylight",
  "feminine-vibrant": "vibrant, romantic, expressive, feminine energy",
  "feminine-soft": "soft, tender, intimate, dreamy",
  "neutral": "balanced, contemplative, refined",
  "dark": "cinematic noir, mysterious, atmospheric",
};

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
      .filter(i => i.status === "watched")
      .slice(0, 25)
      .map(i => `${i.title}${i.user_rating ? ` (★${i.user_rating})` : ""}`)
      .join(", ") || "no history yet";

    const moodText = MOOD_PROMPT[data.mood] ?? data.mood;
    const weatherText = data.weather ? ` The weather mood is ${data.weather}.` : "";
    const langName = data.language === "ar" ? "Arabic" : "English";

    const sys = `You are a cinematic taste curator. Reply ONLY with strict JSON of shape:
{"picks":[{"title":string,"year":number|null,"type":"movie"|"tv","why":string}]}
Return EXACTLY 6 picks. "why" is one short sentence in ${langName}. No prose, no markdown.`;

    const user = `User mood: ${moodText}.${weatherText}
Recently watched: ${watchedSummary}.
Suggest 6 widely-available titles (mix movies, series, anime). Avoid duplicates of recently watched.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { picks: [] }; }
    const picks = Array.isArray(parsed.picks) ? parsed.picks.slice(0, 6) : [];
    return { picks };
  });