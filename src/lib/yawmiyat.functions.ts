import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type YawmiyatMovieMatch = {
  title: string;
  titleAr: string;
  year: number | null;
  posterUrl: string | null;
  quote: string;
  connection: string;
  mood: string;
  color: string;
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

export const getYawmiyatMatch = createServerFn({ method: "POST" }).inputValidator(
  (input: { moodText: string }) =>
    z
      .object({
        moodText: z.string().min(1).max(300),
      })
      .parse(input),
).handler(async ({ data }) => {
  const sys = `أنت شاعر سينمائي. المستخدم يكتب جملة واحدة عن مزاجه اليومي.
مهمتك: اربط هذا المزاج بفيلم أو مسلسل كأنه "ذكري سينمائية" لليوم هذا.

أجب ONLY بـ JSON بالشكل التالي بدون أي نص إضافي:
{
  "title": "اسم الفيلم بالإنجليزية",
  "titleAr": "اسم الفيلم بالعربية",
  "year": سنة الإصدار,
  "posterUrl": "رابط صورة من Pexels للفيلم (ابحث عن صورة سينمائية مناسبة على pexels.com وأعطني الرابط الكامل)",
  "quote": "اقتباس شهير من الفيلم يعكس المزاج، بالعربية",
  "connection": "جملة شاعرية تربط مزاج المستخدم بالفيلم (سطرين باللغة العربية)",
  "mood": "كلمة واحدة تصف المزاج العام (عربي)",
  "color": "لون هيكس يعبر عن الجو العام (مثل #1a1520, #2c1810, #0d1a2c)"
}`;

  const j = await callGroq({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `مزاجي اليوم: "${data.moodText}"` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
    max_tokens: 500,
  });

  const raw = j.choices?.[0]?.message?.content ?? "{}";
  let match: YawmiyatMovieMatch;
  try {
    const parsed = JSON.parse(raw);
    match = {
      title: String(parsed.title ?? "Unknown"),
      titleAr: String(parsed.titleAr ?? parsed.title ?? "غير معروف"),
      year: typeof parsed.year === "number" ? parsed.year : null,
      posterUrl: String(parsed.posterUrl ?? "").startsWith("http")
        ? parsed.posterUrl
        : null,
      quote: String(parsed.quote ?? ""),
      connection: String(parsed.connection ?? ""),
      mood: String(parsed.mood ?? ""),
      color: /^#[0-9a-fA-F]{6}$/.test(parsed.color)
        ? parsed.color
        : "#1a1520",
    };
  } catch {
    throw new Error("فشل في تحليل الاستجابة");
  }

  return { match };
});
