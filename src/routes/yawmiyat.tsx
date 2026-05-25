import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getYawmiyatMatch, type YawmiyatMovieMatch } from "@/lib/yawmiyat.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/yawmiyat")({ component: YawmiyatPage });

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("yawmiyat_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("yawmiyat_session", id);
  }
  return id;
}

type YawmiyatEntry = {
  id: string;
  date: string;
  mood_text: string;
  movie_match: YawmiyatMovieMatch;
  created_at: string;
};

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function formatDateAr(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTHS_AR[d.getMonth()];
  const year = d.getFullYear();
  const dayName = DAYS_AR[d.getDay()];
  return { day, month, year, dayName, full: `${dayName}، ${day} ${month} ${year}` };
}

export default function YawmiyatPage() {
  const [moodText, setMoodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayEntry, setTodayEntry] = useState<YawmiyatEntry | null>(null);
  const [history, setHistory] = useState<YawmiyatEntry[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<YawmiyatEntry | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const getMatch = useServerFn(getYawmiyatMatch);

  const today = new Date().toISOString().split("T")[0];

  const loadData = async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("yawmiyat")
      .select("id, date, mood_text, movie_match, created_at")
      .eq("session_id", sessionId)
      .order("date", { ascending: false })
      .limit(60);
    const entries = (data ?? []) as YawmiyatEntry[];
    setHistory(entries);
    const todayRec = entries.find(e => e.date === today);
    setTodayEntry(todayRec ?? null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = moodText.trim();
    if (!text || loading || todayEntry) return;

    setLoading(true);
    try {
      const { match } = await getMatch({ data: { moodText: text } });
      const sessionId = getSessionId();

      const { data: inserted } = await supabase
        .from("yawmiyat")
        .insert({
          session_id: sessionId,
          date: today,
          mood_text: text,
          movie_match: match,
        })
        .select("id, date, mood_text, movie_match, created_at")
        .single();

      if (inserted) {
        setTodayEntry(inserted as YawmiyatEntry);
        await loadData();
        toast.success("تم تسجيل ذاكرتك السينمائية لليوم");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = todayEntry?.movie_match?.color ?? "#1a1520";

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}
    >
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#e8b86d", fontFamily: "'Cairo', sans-serif", letterSpacing: "-0.01em" }}
          >
            يومية الأفلام
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            جملة واحدة عن مزاجك، وفيلم يُوثّق يومك
          </p>
        </div>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.65)",
            borderRadius: "12px",
            padding: "8px 14px",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          {showTimeline ? "العودة لليوم" : `الخط الزمني (${history.length})`}
        </button>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-3xl mx-auto w-full space-y-6">
        {/* Today's entry section */}
        {!showTimeline && (
          <>
            {/* Today's mood input */}
            {!todayEntry && (
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    padding: "20px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "10px",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    كيف كان يومك؟ اكتب جملة واحدة…
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={moodText}
                    onChange={e => setMoodText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    placeholder="مثال: كنت متعب بس مررت من مكان ذكرني بشيء جميل…"
                    rows={2}
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "15px",
                      padding: "14px 16px",
                      resize: "none",
                      outline: "none",
                      fontFamily: "'Cairo', sans-serif",
                      lineHeight: "1.7",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(232,184,109,0.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                      {moodText.length}/300
                    </span>
                    <button
                      type="submit"
                      disabled={loading || !moodText.trim()}
                      style={{
                        background: loading || !moodText.trim()
                          ? "rgba(232,184,109,0.3)"
                          : "linear-gradient(135deg, #e8b86d, #c8843a)",
                        color: loading || !moodText.trim() ? "rgba(255,255,255,0.4)" : "#1a0f00",
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 24px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: loading || !moodText.trim() ? "not-allowed" : "pointer",
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
                          يُكتب يومك…
                        </>
                      ) : (
                        <>احفظ ذاكرتك</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Today's cinematic memory */}
            {todayEntry && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40 0%, rgba(13,13,20,0.9) 100%)`,
                  border: `1px solid ${accentColor}60`,
                  borderRadius: "28px",
                  overflow: "hidden",
                  boxShadow: `0 0 80px ${accentColor}20`,
                }}
              >
                {/* Date header */}
                <div
                  style={{
                    background: `${accentColor}30`,
                    padding: "16px 24px",
                    borderBottom: `1px solid ${accentColor}30`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        fontSize: "48px",
                        fontWeight: "900",
                        color: "#fff",
                        fontFamily: "'Cairo', sans-serif",
                        lineHeight: 1,
                      }}
                    >
                      {new Date(todayEntry.date).getDate()}
                    </span>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif" }}>
                        {MONTHS_AR[new Date(todayEntry.date).getMonth()]}
                      </div>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
                        {DAYS_AR[new Date(todayEntry.date).getDay()]}
                      </div>
                    </div>
                    {todayEntry.movie_match?.mood && (
                      <span
                        style={{
                          marginRight: "auto",
                          fontSize: "12px",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          background: `${accentColor}50`,
                          color: "#fff",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        {todayEntry.movie_match.mood}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: "24px" }}>
                  {/* Mood text */}
                  <p
                    style={{
                      fontSize: "16px",
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "'Cairo', sans-serif",
                      lineHeight: "1.8",
                      marginBottom: "24px",
                      padding: "16px 20px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "16px",
                      borderRight: `4px solid ${accentColor}`,
                    }}
                  >
                    "{todayEntry.mood_text}"
                  </p>

                  {/* Movie match */}
                  <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                    {todayEntry.movie_match?.posterUrl && (
                      <img
                        src={todayEntry.movie_match.posterUrl}
                        alt={todayEntry.movie_match.titleAr}
                        style={{
                          width: "120px",
                          height: "180px",
                          objectFit: "cover",
                          borderRadius: "16px",
                          boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: `${accentColor}30`,
                          color: "#fff",
                          display: "inline-block",
                          marginBottom: "8px",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        ذاكرة سينمائية
                      </span>
                      <h2
                        style={{
                          fontSize: "24px",
                          fontWeight: "800",
                          color: "#fff",
                          margin: "0 0 4px",
                          fontFamily: "'Cairo', sans-serif",
                          lineHeight: "1.2",
                        }}
                      >
                        {todayEntry.movie_match?.titleAr}
                      </h2>
                      {todayEntry.movie_match?.title !== todayEntry.movie_match?.titleAr && todayEntry.movie_match?.title && (
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 16px", fontStyle: "italic" }}>
                          {todayEntry.movie_match.title}{todayEntry.movie_match.year ? ` · ${todayEntry.movie_match.year}` : ""}
                        </p>
                      )}

                      {/* Quote */}
                      {todayEntry.movie_match?.quote && (
                        <p
                          style={{
                            fontSize: "15px",
                            color: "rgba(255,255,255,0.7)",
                            fontStyle: "italic",
                            margin: "0 0 12px",
                            fontFamily: "'Cairo', sans-serif",
                            lineHeight: "1.7",
                          }}
                        >
                          "{todayEntry.movie_match.quote}"
                        </p>
                      )}

                      {/* Connection */}
                      {todayEntry.movie_match?.connection && (
                        <p
                          style={{
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.55)",
                            margin: 0,
                            fontFamily: "'Cairo', sans-serif",
                            lineHeight: "1.7",
                          }}
                        >
                          {todayEntry.movie_match.connection}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats mini summary */}
            {history.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {history.slice(0, 7).map(entry => {
                  const d = new Date(entry.date);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setShowTimeline(true);
                        setTimeout(() => setSelectedEntry(entry), 100);
                      }}
                      style={{
                        flex: "1 1 80px",
                        maxWidth: "90px",
                        padding: "12px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      }}
                    >
                      <div style={{ fontSize: "24px", fontWeight: "800", color: "#fff", fontFamily: "'Cairo', sans-serif" }}>
                        {d.getDate()}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "'Cairo', sans-serif" }}>
                        {MONTHS_AR[d.getMonth()].slice(0, 3)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Timeline view */}
        {showTimeline && (
          <div>
            {/* Month navigation */}
            <div style={{ marginBottom: "24px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'Cairo', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "16px",
                }}
              >
                الخط الزمني
              </h2>

              {/* Timeline entries */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {history.map(entry => {
                  const d = new Date(entry.date);
                  const isSelected = selectedEntry?.id === entry.id;
                  const c = entry.movie_match?.color ?? "#1a1520";
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(isSelected ? null : entry)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                        padding: "20px",
                        background: isSelected
                          ? `linear-gradient(135deg, ${c}30 0%, rgba(255,255,255,0.04) 100%)`
                          : "rgba(255,255,255,0.04)",
                        border: isSelected ? `1px solid ${c}50` : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "20px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "right",
                      }}
                    >
                      {/* Date block */}
                      <div
                        style={{
                          minWidth: "64px",
                          textAlign: "center",
                          padding: "12px",
                          background: `${c}25`,
                          borderRadius: "14px",
                        }}
                      >
                        <div style={{ fontSize: "28px", fontWeight: "900", color: "#fff", fontFamily: "'Cairo', sans-serif", lineHeight: 1 }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
                          {MONTHS_AR[d.getMonth()]}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.7)",
                            fontFamily: "'Cairo', sans-serif",
                            lineHeight: "1.6",
                            margin: "0 0 8px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.mood_text}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif" }}>
                            {entry.movie_match?.titleAr}
                          </span>
                          {entry.movie_match?.mood && (
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "3px 8px",
                                borderRadius: "999px",
                                background: `${c}40`,
                                color: "rgba(255,255,255,0.8)",
                                fontFamily: "'Cairo', sans-serif",
                              }}
                            >
                              {entry.movie_match.mood}
                            </span>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isSelected && (
                          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            {entry.movie_match?.quote && (
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "rgba(255,255,255,0.6)",
                                  fontStyle: "italic",
                                  margin: "0 0 12px",
                                  fontFamily: "'Cairo', sans-serif",
                                }}
                              >
                                "{entry.movie_match.quote}"
                              </p>
                            )}
                            {entry.movie_match?.connection && (
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.45)",
                                  margin: 0,
                                  fontFamily: "'Cairo', sans-serif",
                                }}
                              >
                                {entry.movie_match.connection}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {history.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255,255,255,0.3)", fontFamily: "'Cairo', sans-serif" }}>
                  لا توجد ذكريات بعد. ابدأ بكتابة مزاجك اليوم!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Font import + animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        textarea { caret-color: #e8b86d; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>
    </div>
  );
}
