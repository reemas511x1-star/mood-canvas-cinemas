import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWeshRecommendation, type WeshRecommendation } from "@/lib/wesh.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/wesh")({ component: WeshPage });

const MOOD_TAGS = [
  { id: "happy", label: "سعيد", emoji: "😊" },
  { id: "sad", label: "حزين", emoji: "😢" },
  { id: "excited", label: "متحمس", emoji: "🎉" },
  { id: "need_cry", label: "بحاجة للبكاء", emoji: "😭" },
  { id: "exhausted", label: "مرهق", emoji: "😴" },
  { id: "bored", label: "مملول", emoji: "😒" },
  { id: "anxious", label: "قلقان", emoji: "😰" },
  { id: "romantic", label: "رومانسي", emoji: "💕" },
  { id: "adventurous", label: "مغامر", emoji: "🚀" },
  { id: "scared", label: "مرعوب", emoji: "😱" },
  { id: "curious", label: "فضولي", emoji: "🤔" },
  { id: "angry", label: "ناقم", emoji: "😤" },
  { id: "nostalgic", label: "حنين للماضي", emoji: "🕰️" },
  { id: "need_motivation", label: "محتاج تحفيز", emoji: "💪" },
  { id: "need_laugh", label: "محتاج ضحك", emoji: "😂" },
];

const TYPE_OPTIONS = [
  { id: "movie", label: "فيلم", icon: "🎬" },
  { id: "series", label: "مسلسل", icon: "📺" },
  { id: "anime", label: "أنمي", icon: "🎌" },
];

const GENRE_COLORS: Record<string, string> = {
  دراما: "#e05c5c",
  كوميديا: "#f0a830",
  إثارة: "#4db8ff",
  رعب: "#b04dff",
  أكشن: "#ff5c3a",
  رومانسي: "#ff6fa8",
  "خيال علمي": "#3ae8c0",
  وثائقي: "#8fd46f",
  مغامرة: "#f7c948",
  جريمة: "#c0c0c0",
  أنمي: "#ff6b9d",
};

function getAccent(genre: string) {
  for (const [key, color] of Object.entries(GENRE_COLORS)) {
    if (genre?.includes(key)) return color;
  }
  return "#e8b86d";
}

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("wesh_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wesh_session", id);
  }
  return id;
}

function getMoodAccent(moodTags: string[]) {
  const colorMap: Record<string, string> = {
    happy: "#f0a830",
    sad: "#4a6fa5",
    excited: "#ff5c3a",
    need_cry: "#7a5c7a",
    exhausted: "#6b7280",
    bored: "#8b8b8b",
    anxious: "#e8b86d",
    romantic: "#ff6fa8",
    adventurous: "#3ae8c0",
    scared: "#b04dff",
    curious: "#4db8ff",
    angry: "#dc2626",
    nostalgic: "#d97706",
    need_motivation: "#22c55e",
    need_laugh: "#fbbf24",
  };
  for (const tag of moodTags) {
    if (colorMap[tag]) return colorMap[tag];
  }
  return "#e8b86d";
}

type HistoryItem = {
  id: string;
  mood_text: string;
  recommendation: WeshRecommendation;
  created_at: string;
};

export default function WeshPage() {
  const [mood, setMood] = useState("");
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["movie", "series"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeshRecommendation | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [animating, setAnimating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recommend = useServerFn(getWeshRecommendation);

  const loadHistory = async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("wesh_recommendations")
      .select("id, mood_text, recommendation, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data ?? []) as HistoryItem[]);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleMoodTag = (tagId: string) => {
    setSelectedMoodTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = mood.trim();
    if ((!text && selectedMoodTags.length === 0) || loading || selectedTypes.length === 0) return;

    const moodLabels = selectedMoodTags.map(id => MOOD_TAGS.find(t => t.id === id)?.label).filter(Boolean);
    const typeLabels = selectedTypes.map(id => TYPE_OPTIONS.find(t => t.id === id)?.label).filter(Boolean);
    const fullMood = [text, moodLabels.join("، ")].filter(Boolean).join(" | ");
    const typesContext = `المستخدم يريد: ${typeLabels.join(" أو ")}`;

    setLoading(true);
    setResult(null);
    setAnimating(false);

    try {
      const { recommendation } = await recommend({ data: { mood: `${fullMood}\n${typesContext}` } });
      setResult(recommendation);
      setAnimating(true);

      const sessionId = getSessionId();
      await supabase.from("wesh_recommendations").insert({
        session_id: sessionId,
        mood_text: fullMood,
        recommendation,
      });
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const moodAccent = getMoodAccent(selectedMoodTags);
  const accent = result ? getAccent(result.genre) : moodAccent;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}
    >
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ color: "#e8b86d", fontFamily: "'Cairo', sans-serif", letterSpacing: "-0.01em" }}>
              وش أشوف الليلة؟
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              اكتب مزاجك، وخلّنا نختار لك
            </p>
          </div>
          <button
            onClick={() => { setShowHistory(!showHistory); }}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: "12px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            {showHistory ? "اخفِ السجل" : `السجل (${history.length})`}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-3xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Input card */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "16px sm:px-5 sm:py-6",
            }}
          >
            {/* Mood tags */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: "10px",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                اختر مزاجك:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MOOD_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleMoodTag(tag.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      border: selectedMoodTags.includes(tag.id)
                        ? `1px solid ${moodAccent}`
                        : "1px solid rgba(255,255,255,0.15)",
                      background: selectedMoodTags.includes(tag.id)
                        ? `${moodAccent}25`
                        : "rgba(255,255,255,0.04)",
                      color: selectedMoodTags.includes(tag.id) ? "#fff" : "rgba(255,255,255,0.6)",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "'Cairo', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type selection */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: "10px",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                ماذا تريد أن تشاهد؟
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {TYPE_OPTIONS.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "14px",
                      border: selectedTypes.includes(type.id)
                        ? `1px solid ${moodAccent}`
                        : "1px solid rgba(255,255,255,0.15)",
                      background: selectedTypes.includes(type.id)
                        ? `${moodAccent}20`
                        : "rgba(255,255,255,0.04)",
                      color: selectedTypes.includes(type.id) ? "#fff" : "rgba(255,255,255,0.5)",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontFamily: "'Cairo', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{type.icon}</span>
                    <span style={{ fontWeight: "600" }}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Free text input */}
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "10px",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              أو اكتب مزاجك بتفصيل أكثر (اختياري):
            </label>
            <textarea
              ref={textareaRef}
              value={mood}
              onChange={e => setMood(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="مثال: تعبان ومحتاج شيء يريّح، أو متحمس وأبي أكشن قوي…"
              rows={2}
              disabled={loading}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                padding: "12px 14px",
                resize: "none",
                outline: "none",
                fontFamily: "'Cairo', sans-serif",
                lineHeight: "1.6",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(232,184,109,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <div className="flex items-center justify-between mt-3">
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                {mood.length}/500
              </span>
              <button
                type="submit"
                disabled={loading || selectedTypes.length === 0}
                style={{
                  background: loading || selectedTypes.length === 0
                    ? "rgba(232,184,109,0.3)"
                    : "linear-gradient(135deg, #e8b86d, #c8843a)",
                  color: loading || selectedTypes.length === 0 ? "rgba(255,255,255,0.4)" : "#1a0f00",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: loading || selectedTypes.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "'Cairo', sans-serif",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                    جاري التفكير…
                  </>
                ) : (
                  <>اقترح لي</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Loading shimmer */}
        {loading && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "32px 24px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "64px", height: "90px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "24px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", marginBottom: "12px", width: "60%" }} />
                <div style={{ height: "14px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", marginBottom: "8px" }} />
                <div style={{ height: "14px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", width: "80%" }} />
              </div>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && !loading && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent}40`,
              borderRadius: "24px",
              overflow: "hidden",
              animation: animating ? "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
              boxShadow: `0 0 60px ${accent}18`,
            }}
          >
            <div style={{ height: "3px", background: `linear-gradient(90deg, ${accent}cc, ${accent}22)` }} />

            <div style={{ padding: "20px sm:px-6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "36px" }}>{result.emoji || "🎬"}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: `${accent}22`,
                    color: accent,
                    border: `1px solid ${accent}44`,
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {result.type === "movie" ? "فيلم" : result.type === "anime" ? "أنمي" : "مسلسل"}
                </span>
                {result.genre && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {result.genre}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#fff", margin: "0 0 4px", fontFamily: "'Cairo', sans-serif" }}>
                {result.titleAr}
              </h2>
              {result.title !== result.titleAr && (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 16px", fontStyle: "italic" }}>
                  {result.title}{result.year ? ` · ${result.year}` : ""}
                </p>
              )}

              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: "1.8",
                  fontFamily: "'Cairo', sans-serif",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  borderRight: `3px solid ${accent}99`,
                  margin: "0 0 16px",
                }}
              >
                {result.why}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {result.rating && result.rating !== "N/A" && (
                  <span style={{ fontSize: "14px", color: accent, fontWeight: "700", fontFamily: "'Cairo', sans-serif" }}>
                    ★ {result.rating}
                  </span>
                )}
                <button
                  onClick={() => {
                    setResult(null);
                    setMood("");
                    setSelectedMoodTags([]);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    marginRight: "auto",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "'Cairo', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  اسألني مجدداً
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && history.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
                توصياتك السابقة
              </h3>
            </div>
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {history.map((item, i) => {
                const rec = item.recommendation as WeshRecommendation;
                const a = getAccent(rec.genre ?? "");
                return (
                  <button
                    key={item.id}
                    onClick={() => { setResult(rec); setAnimating(true); setShowHistory(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 20px",
                      background: "transparent",
                      border: "none",
                      borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      cursor: "pointer",
                      textAlign: "right",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>{rec.emoji || "🎬"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {rec.titleAr}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.mood_text}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", background: `${a}22`, color: a, flexShrink: 0 }}>
                      {rec.type === "movie" ? "فيلم" : rec.type === "anime" ? "أنمي" : "مسلسل"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showHistory && history.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.3)", fontFamily: "'Cairo', sans-serif", fontSize: "14px" }}>
            لا توجد توصيات سابقة بعد
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        textarea { caret-color: #e8b86d; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>
    </div>
  );
}
