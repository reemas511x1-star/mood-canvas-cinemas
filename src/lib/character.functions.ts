import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type CharacterMatch = {
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  type: "movie" | "series" | "anime";
  year: number | null;
  description: string;
  whyMatch: string;
  quality: string;
  quote: string;
  emoji: string;
};

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

export const getCharacterMatch = createServerFn({ method: "POST" }).inputValidator(
  (input: { answers: string }) =>
    z.object({ answers: z.string().min(1) }).parse(input),
).handler(async ({ data }) => {
  const sys = `أنت محلل شخصيات سينمائي. بناءً على إجابات المستخدم، ربطه بشخصية سينمائية شهيرة (من فيلم أو مسلسل أو أنمي).

أجب ONLY بـ JSON بدون أي نص إضافي:
{
  "name": "اسم الشخصية بالإنجليزية",
  "nameAr": "اسم الشخصية بالعربية",
  "title": "اسم العمل بالإنجليزية",
  "titleAr": "اسم العمل بالعربية",
  "type": "movie" أو "series" أو "anime",
  "year": سنة الإصدار,
  "description": "وصف قصير للشخصية",
  "whyMatch": "لماذا تطابق هذه الشخصية مع إجابات المستخدم",
  "quality": "صفة رئيسية للشخصية",
  "quote": "اقتباس شهير للشخصية بالعربية",
  "emoji": "إيموجي يعبر عن الشخصية"
}`;

  const j = await callGroq({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `إجاباتي:\n${data.answers}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
    max_tokens: 600,
  });

  const raw = j.choices?.[0]?.message?.content ?? "{}";
  let match: CharacterMatch;
  try {
    const parsed = JSON.parse(raw);
    match = {
      name: String(parsed.name ?? "Unknown"),
      nameAr: String(parsed.nameAr ?? parsed.name ?? "غير معروف"),
      title: String(parsed.title ?? ""),
      titleAr: String(parsed.titleAr ?? parsed.title ?? ""),
      type: ["movie", "series", "anime"].includes(parsed.type) ? parsed.type : "movie",
      year: typeof parsed.year === "number" ? parsed.year : null,
      description: String(parsed.description ?? ""),
      whyMatch: String(parsed.whyMatch ?? ""),
      quality: String(parsed.quality ?? ""),
      quote: String(parsed.quote ?? ""),
      emoji: String(parsed.emoji ?? "🎭"),
    };
  } catch {
    throw new Error("فشل في تحليل الاستجابة");
  }

  return { match };
});
