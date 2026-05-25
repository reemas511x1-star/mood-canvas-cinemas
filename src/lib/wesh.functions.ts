import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type WeshRecommendation = {
  title: string;
  titleAr: string;
  type: "movie" | "series";
  year: number | null;
  genre: string;
  why: string;
  rating: string;
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

export const getWeshRecommendation = createServerFn({ method: "POST" }).inputValidator(
  (input: { mood: string }) =>
    z
      .object({
        mood: z.string().min(1).max(500),
      })
      .parse(input),
).handler(async ({ data }) => {
  const sys = `أنت محلل مشاعر وخبير أفلام. المستخدم يصف مزاجه بالعربية أو الإنجليزية.
مهمتك: اقترح فيلماً أو مسلسلاً واحداً فقط يناسب مزاجه تماماً.

أجب ONLY بـ JSON بالشكل التالي بدون أي نص إضافي:
{
  "title": "اسم العمل بالإنجليزية",
  "titleAr": "اسم العمل بالعربية أو ترجمته",
  "type": "movie" أو "series",
  "year": سنة الإصدار كرقم أو null,
  "genre": "النوع مثل دراما أو كوميديا أو إثارة",
  "why": "جملة أو جملتان بالعربية تشرح لماذا يناسب هذا المزاج",
  "rating": "التقييم مثل 8.5/10 أو N/A",
  "emoji": "إيموجي واحد يعبر عن المزاج"
}`;

  const j = await callGroq({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `مزاجي الآن: ${data.mood}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
    max_tokens: 400,
  });

  const raw = j.choices?.[0]?.message?.content ?? "{}";
  let rec: WeshRecommendation;
  try {
    const parsed = JSON.parse(raw);
    rec = {
      title: String(parsed.title ?? ""),
      titleAr: String(parsed.titleAr ?? parsed.title ?? ""),
      type: parsed.type === "series" ? "series" : "movie",
      year: typeof parsed.year === "number" ? parsed.year : null,
      genre: String(parsed.genre ?? ""),
      why: String(parsed.why ?? ""),
      rating: String(parsed.rating ?? ""),
      emoji: String(parsed.emoji ?? ""),
    };
  } catch {
    throw new Error("فشل في تحليل الاستجابة");
  }

  return { recommendation: rec };
});
