import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type MovieCountry = {
  title: string;
  titleAr: string;
  country: string;
  countryAr: string;
  region: string;
  year: number | null;
  posterUrl: string | null;
  type: "movie" | "series" | "anime";
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

export const getMovieCountry = createServerFn({ method: "POST" }).inputValidator(
  (input: { movieName: string }) =>
    z.object({ movieName: z.string().min(1).max(200) }).parse(input),
).handler(async ({ data }) => {
  const sys = `أنت خبير سينمائي. المستخدم يعطيك اسم فيلم أو مسلسل، وتُرجع له معلومات البلد الأصلي للعمل.

أجب ONLY بـ JSON بدون أي نص إضافي:
{
  "title": "اسم العمل بالإنجليزية",
  "titleAr": "اسم العمل بالعربية",
  "country": "اسم البلد بالإنجليزية (البلد الرئيسي للإنتاج)",
  "countryAr": "اسم البلد بالعربية",
  "region": "القارة أو المنطقة (مثل أوروبا، آسيا، أفريقيا، أمريكا، الشرق الأوسط)",
  "year": سنة الإصدار,
  "posterUrl": "رابط صورة من Pexels تعبر عن البلد أو العمل (رابط كامل من pexels.com)",
  "type": "movie" أو "series" أو "anime"
}

مهم: إعطني البلد الأصلي والأساسي للعمل، لو مشترك بين بلدين اختر البلد الرئيسي.`;

  const j = await callGroq({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: data.movieName },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 400,
  });

  const raw = j.choices?.[0]?.message?.content ?? "{}";
  let info: MovieCountry;
  try {
    const parsed = JSON.parse(raw);
    info = {
      title: String(parsed.title ?? data.movieName),
      titleAr: String(parsed.titleAr ?? parsed.title ?? data.movieName),
      country: String(parsed.country ?? "Unknown"),
      countryAr: String(parsed.countryAr ?? parsed.country ?? "غير معروف"),
      region: String(parsed.region ?? ""),
      year: typeof parsed.year === "number" ? parsed.year : null,
      posterUrl: String(parsed.posterUrl ?? "").startsWith("http") ? parsed.posterUrl : null,
      type: ["movie", "series", "anime"].includes(parsed.type) ? parsed.type : "movie",
    };
  } catch {
    throw new Error("فشل في تحليل الاستجابة");
  }

  return { info };
});
