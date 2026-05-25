import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/quotes")({ component: QuotesPage });

const CURATED_QUOTES = [
  { quote_text: "الحياة مثل صندوق الشوكولاتة، لا تعرف ماذا ستحصل عليه.", title: "Forrest Gump", title_ar: "فورست غامب", character_name: "فورست غامب", type: "movie" },
  { quote_text: "مع كل قوة عظيمة، تأتي مسؤولية عظيمة.", title: "Spider-Man", title_ar: "سبايدر مان", character_name: "العم بن", type: "movie" },
  { quote_text: "بعد الظلمة يأتي الفجر، وبعد المطر تظهر الشمس. وبعد كل قصة حب فاشلة، تأتي قصة حب حقيقية.", title: "The Notebook", title_ar: "المفكرة", character_name: "نوح", type: "movie" },
  { quote_text: "نحن لا نموت حقاً طالما أننا نعيش في قلوب من أحببناهم.", title: "Harry Potter and the Deathly Hallows", title_ar: "هاري بوتر ومقدسات الموت", character_name: "ألباس دمبلدور", type: "movie" },
  { quote_text: "لا يهم كم تسقط، المهم كم تنهض.", title: "Rocky Balboa", title_ar: "روكي بالبوا", character_name: "روكي", type: "movie" },
  { quote_text: "الطريق إلى النجاح ليس سهلاً. عليك أن تذهب من خلال كل هذه العقبات.", title: "Pursuit of Happyness", title_ar: "البحث عن السعادة", character_name: "كريس غاردنر", type: "movie" },
  { quote_text: "حين تكون قد فقدت كل أمل، ابحث عنه في مكان آخر.", title: "The Shawshank Redemption", title_ar: "الخلاص من شاوشانك", character_name: "أندرو ديفن", type: "movie" },
  { quote_text: "أحياناً أفكر في مستقبلنا وأتساءل كيف سأكون بدونه.", title: "La La Land", title_ar: "لا لا لاند", character_name: "سيباستيان", type: "movie" },
  { quote_text: "نحن نرى ما نريد أن نرى.", title: "The Great Gatsby", title_ar: "غاتسبي العظيم", character_name: "جاي غاتسبي", type: "movie" },
  { quote_text: "إن لم تحاول فستندم على ذلك طوال حياتك.", title: "Inception", title_ar: "استهلال", character_name: "كوب", type: "movie" },
  { quote_text: "العالم مليء بالأشياء الواضحة التي لا يراها أحد إلا من يعرف كيف يبحث عنها.", title: "Sherlock", title_ar: "شرلوك", character_name: "شرلوك هولمز", type: "series" },
  { quote_text: "الشتاء قادم.", title: "Game of Thrones", title_ar: "صراع العروش", character_name: "نيد ستارك", type: "series" },
  { quote_text: "عندما تلعب لعبة العروش إما تفوز أو تموت.", title: "Game of Thrones", title_ar: "صراع العروش", character_name: "سيرسي لانستر", type: "series" },
  { quote_text: "لا يمكنك تحمل الحقيقة!", title: "Breaking Bad", title_ar: "اختلال ضال", character_name: "والتر وايت", type: "series" },
  { quote_text: "نحن من نختار من نكون.", title: "Naruto", title_ar: "ناروتو", character_name: "ناروتو أوزوماكي", type: "anime" },
  { quote_text: "القوة الحقيقية لا تأتي من السيطرة على الآخرين، بل من السيطرة على النفس.", title: "Death Note", title_ar: "مذكرة الموت", character_name: "إل", type: "anime" },
  { quote_text: "البشر يخافون من المجهول، وهذا هو سبب كل الحروب والصراعات في العالم.", title: "Attack on Titan", title_ar: "هجوم العمالقة", character_name: "أروين سميث", type: "anime" },
  { quote_text: "العالم ليس جميلاً فقط، ولكنه يتحسن كل يوم.", title: "Your Name", title_ar: "اسمك", character_name: "تاكي", type: "anime" },
];

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("quotes_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("quotes_session", id);
  }
  return id;
}

type Quote = {
  id: string;
  session_id: string;
  quote_text: string;
  title: string;
  title_ar: string;
  character_name: string;
  type: string;
  is_curated: boolean;
  created_at: string;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [newQuote, setNewQuote] = useState({ text: "", title: "", titleAr: "", character: "", type: "movie" });
  const [filter, setFilter] = useState<"all" | "movie" | "series" | "anime">("all");

  const loadQuotes = async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    setQuotes((data ?? []) as Quote[]);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const dailyQuoteIndex = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return CURATED_QUOTES.length > 0 ? seed % CURATED_QUOTES.length : 0;
  }, []);

  useEffect(() => {
    const curated = CURATED_QUOTES[dailyQuoteIndex];
    if (curated) {
      setDailyQuote({
        id: `daily-${dailyQuoteIndex}`,
        session_id: "curated",
        ...curated,
        is_curated: true,
        created_at: new Date().toISOString(),
      } as Quote);
    }
  }, [dailyQuoteIndex]);

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.text.trim() || !newQuote.title.trim()) {
      toast.error("اكتب الاقتباس والعنوان");
      return;
    }
    const sessionId = getSessionId();
    const { error } = await supabase.from("quotes").insert({
      session_id: sessionId,
      quote_text: newQuote.text,
      title: newQuote.title,
      title_ar: newQuote.titleAr,
      character_name: newQuote.character,
      type: newQuote.type,
    });
    if (error) {
      toast.error("حدث خطأ");
    } else {
      toast.success("تم حفظ الاقتباس!");
      setNewQuote({ text: "", title: "", titleAr: "", character: "", type: "movie" });
      setShowAddForm(false);
      loadQuotes();
    }
  };

  const handleDelete = async (id: string) => {
    const sessionId = getSessionId();
    await supabase.from("quotes").delete().eq("id", id).eq("session_id", sessionId);
    loadQuotes();
    toast.success("تم حذف الاقتباس");
  };

  const filteredQuotes = quotes.filter(q => filter === "all" || q.type === filter);

  const getAccentColor = (type: string) => {
    switch (type) {
      case "anime": return "#ff6b9d";
      case "series": return "#4db8ff";
      default: return "#e8b86d";
    }
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}>
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ color: "#e8b86d", fontFamily: "'Cairo', sans-serif" }}>
              اقتباساتي
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              اجمع أجمل عبارات الأفلام والمسلسلات
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: "12px",
              padding: "8px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {showAddForm ? "إلغاء" : "اقتباس جديد +"}
          </button>
        </div>
      </header>

      <main className="px-4 pb-12 max-w-3xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Daily Quote */}
        {dailyQuote && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(232,184,109,0.08) 0%, rgba(255,107,157,0.06) 100%)",
              border: "1px solid rgba(232,184,109,0.2)",
              borderRadius: "24px",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: "12px", fontSize: "12 px", color: "rgba(255,255,255,0.4)", fontFamily: "'Cairo', sans-serif" }}>
              اقتباس اليوم
            </div>
            <p
              style={{
                fontSize: "20px sm:text-2xl",
                fontWeight: "600",
                color: "#fff",
                fontFamily: "'Cairo', sans-serif",
                lineHeight: "1.7",
                marginBottom: "20px",
                fontStyle: "italic",
              }}
            >
              "{dailyQuote.quote_text}"
            </p>
            <div>
              <span style={{ color: "#e8b86d", fontWeight: "700", fontFamily: "'Cairo', sans-serif" }}>
                {dailyQuote.title_ar}
              </span>
              {dailyQuote.character_name && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}> — {dailyQuote.character_name}</span>
              )}
            </div>
          </div>
        )}

        {/* Add Quote Form */}
        {showAddForm && (
          <form onSubmit={handleAddQuote} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "8px" }}>الاقتباس:</label>
              <textarea
                value={newQuote.text}
                onChange={e => setNewQuote({ ...newQuote, text: e.target.value })}
                rows={3}
                placeholder="اكتب الاقتباس هنا..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                  padding: "14px 16px",
                  resize: "none",
                  outline: "none",
                  fontFamily: "'Cairo', sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "8px" }}>اسم العمل (إنجلش):</label>
                <input
                  type="text"
                  value={newQuote.title}
                  onChange={e => setNewQuote({ ...newQuote, title: e.target.value })}
                  placeholder="The Godfather"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    padding: "12px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "8px" }}>اسم العمل (عربي):</label>
                <input
                  type="text"
                  value={newQuote.titleAr}
                  onChange={e => setNewQuote({ ...newQuote, titleAr: e.target.value })}
                  placeholder="العراب"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    padding: "12px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "8px" }}>اسم الشخصية:</label>
                <input
                  type="text"
                  value={newQuote.character}
                  onChange={e => setNewQuote({ ...newQuote, character: e.target.value })}
                  placeholder="فيطو كورليوني"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    padding: "12px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "8px" }}>النوع:</label>
                <select
                  value={newQuote.type}
                  onChange={e => setNewQuote({ ...newQuote, type: e.target.value })}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    padding: "12px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="movie">فيلم</option>
                  <option value="series">مسلسل</option>
                  <option value="anime">أنمي</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #e8b86d, #c8843a)", color: "#1a0f00", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              حفظ الاقتباس
            </button>
          </form>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px" }}>
          {(["all", "movie", "series", "anime"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: filter === f ? "1px solid #e8b86d" : "1px solid rgba(255,255,255,0.1)",
                background: filter === f ? "rgba(232,184,109,0.15)" : "rgba(255,255,255,0.04)",
                color: filter === f ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {f === "all" ? "الكل" : f === "movie" ? "أفلام" : f === "series" ? "مسلسلات" : "أنمي"} ({f === "all" ? quotes.length : quotes.filter(q => q.type === f).length})
            </button>
          ))}
        </div>

        {/* Quotes Grid */}
        <div style={{ display: "grid", gap: "16px" }}>
          {filteredQuotes.map(quote => {
            const accent = getAccentColor(quote.type);
            return (
              <div
                key={quote.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${accent}30`,
                  borderRadius: "20px",
                  padding: "20px",
                }}
              >
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", fontFamily: "'Cairo', sans-serif", marginBottom: "14px", lineHeight: "1.7", fontStyle: "italic" }}>
                  "{quote.quote_text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ color: accent, fontWeight: "700", fontFamily: "'Cairo', sans-serif" }}>{quote.title_ar || quote.title}</span>
                    {quote.character_name && <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}> — {quote.character_name}</span>}
                    <span style={{ fontSize: "11px", padding: "3px 8px 3px 8px", marginRight: "12px", borderRadius: "999px", background: `${accent}20`, color: accent, fontFamily: "'Cairo', sans-serif" }}>
                      {quote.type === "movie" ? "فيلم" : quote.type === "anime" ? "أنمي" : "مسلسل"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(quote.id)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuotes.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.3)", fontFamily: "'Cairo', sans-serif" }}>
            لم تحفظ أي اقتباسات بعد
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        textarea, input, select { caret-color: #e8b86d; }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #1a1520; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>
    </div>
  );
}
