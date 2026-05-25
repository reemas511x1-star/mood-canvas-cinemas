import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCharacterMatch, type CharacterMatch } from "@/lib/character.functions";

export const Route = createFileRoute("/character")({ component: CharacterPage });

const QUESTIONS = [
  {
    id: "weekend",
    question: "كيف تقضي عطلة نهاية الأسبوع؟",
    options: [
      { val: "adventure", label: "أخطط لمغامرة جديدة" },
      { val: "home", label: "أبقى في البيت مع فيلم وكتاب" },
      { val: "social", label: "ألتقي الأصدقاء ونضحك" },
      { val: "work", label: "أعمل على مشروع شخصي" },
    ],
  },
  {
    id: "problem",
    question: "كيف تتعامل مع المشاكل؟",
    options: [
      { val: "logic", label: "أحلل المنطق وأجد الحل الأمثل" },
      { val: "emotion", label: "أتبع قلبي وحدسي" },
      { val: "fight", label: "أواجهها مباشرة بدون تردد" },
      { val: "avoid", label: "أتجنب الصراع قدر الإمكان" },
    ],
  },
  {
    id: "friends",
    question: "ما نوع الصديق الذي أنت عليه؟",
    options: [
      { val: "listener", label: "المستمع الجيد والناصح" },
      { val: "leader", label: "القائد الذي يأخذ المبادرة" },
      { val: "fun", label: "المضحك الذي يرفع المعنويات" },
      { val: "mysterious", label: "الغامض الذي لا يفصح عن كل شيء" },
    ],
  },
  {
    id: "movie_pref",
    question: "ما نوع الأفلام الذي تفضله؟",
    options: [
      { val: "drama", label: "دراما عميقة تلامس المشاعر" },
      { val: "action", label: "أكشن ومغامرات مثيرة" },
      { val: "comedy", label: "كوميديا تضحكني من قلبي" },
      { val: "scifi", label: "خيال علمي يأخذني لعوالم جديدة" },
    ],
  },
  {
    id: "fear",
    question: "ما الذي يخيفك أكثر؟",
    options: [
      { val: "loneliness", label: "الوحدة والخروج دون وعود" },
      { val: "failure", label: "الفشل في تحقيق طموحاتي" },
      { val: "loss", label: "فقدان من أحب" },
      { val: "unknown", label: "المجهول والمستقبل غير المتوقع" },
    ],
  },
  {
    id: "morning",
    question: "كيف يبدأ يومك المثالي؟",
    options: [
      { val: "early", label: "صباحاً مع قهوة وهدوء" },
      { val: "chaos", label: "بنشاط وسرعة وضجيج" },
      { val: "lazy", label: "متأخراً بدون أي ضغط" },
      { val: "passion", label: "بشغف على مشروع أحبه" },
    ],
  },
  {
    id: "superpower",
    question: "لو كان لك قوة خارقة، ماذا تختار؟",
    options: [
      { val: "read_minds", label: "قراءة الأفكار" },
      { val: "fly", label: "الطيران والحرية المطلقة" },
      { val: "heal", label: "شفاء الآخرين" },
      { val: "strength", label: "قوة لا تُقهَر" },
    ],
  },
  {
    id: "ending",
    question: "كيف تحب أن ينتهي الفيلم؟",
    options: [
      { val: "happy", label: "نهاية سعيدة ومُرضية" },
      { val: "open", label: "نهاية مفتوحة للتأويل" },
      { val: "tragic", label: "نهاية مؤثرة تترك أثراً" },
      { val: "twist", label: "نهاية صادمة غير متوقعة" },
    ],
  },
];

export default function CharacterPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CharacterMatch | null>(null);
  const getMatch = useServerFn(getCharacterMatch);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) return;
    setLoading(true);
    const answersText = QUESTIONS.map(q => {
      const selected = q.options.find(o => o.val === answers[q.id]);
      return `${q.question}\nالجواب: ${selected?.label}`;
    }).join("\n\n");

    try {
      const { match } = await getMatch({ data: { answers: answersText } });
      setResult(match);
    } catch {
      // Will show error in UI
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  if (result) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}>
        <div style={{ maxWidth: "520px", width: "100%" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "32px",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            {/* Character emoji */}
            <div style={{ padding: "40px 20px 20px", background: "linear-gradient(180deg, rgba(232,184,109,0.1) 0%, transparent 100%)" }}>
              <span style={{ fontSize: "100px" }}>{result.emoji}</span>
            </div>

            <div style={{ padding: "0 28px 32px" }}>
              {/* Name */}
              <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#fff", margin: "0 0 8px", fontFamily: "'Cairo', sans-serif" }}>
                {result.nameAr}
              </h1>
              {result.name !== result.nameAr && (
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: "0 0 8px", fontStyle: "italic" }}>
                  {result.name}
                </p>
              )}

              {/* From */}
              <p style={{ fontSize: "15px", color: "#e8b86d", margin: "0 0 20px", fontFamily: "'Cairo', sans-serif" }}>
                {result.titleAr}{result.year ? ` (${result.year})` : ""}
              </p>

              {/* Quality badge */}
              <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "999px", background: "rgba(232,184,109,0.15)", border: "1px solid rgba(232,184,109,0.3)", marginBottom: "20px" }}>
                <span style={{ color: "#e8b86d", fontWeight: "700", fontFamily: "'Cairo', sans-serif" }}>{result.quality}</span>
              </div>

              {/* Description */}
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: "1.8", fontFamily: "'Cairo', sans-serif", margin: "0 0 20px" }}>
                {result.description}
              </p>

              {/* Why match */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", marginBottom: "20px", borderRight: "3px solid #e8b86d" }}>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.7", fontFamily: "'Cairo', sans-serif", margin: 0 }}>
                  <strong style={{ color: "#e8b86d" }}>لماذا أنت {result.nameAr}؟</strong><br />
                  {result.whyMatch}
                </p>
              </div>

              {/* Quote */}
              <div style={{ marginBottom: "24px", fontStyle: "italic", color: "rgba(255,255,255,0.6)", fontFamily: "'Cairo', sans-serif" }}>
                "{result.quote}"
              </div>

              {/* Type badge */}
              <span style={{ display: "inline-block", fontSize: "11px", padding: "4px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
                {result.type === "movie" ? "فيلم" : result.type === "anime" ? "أنمي" : "مسلسل"}
              </span>

              {/* Restart button */}
              <button
                onClick={handleRestart}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "14px",
                  padding: "16px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "15px",
                  cursor: "pointer",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                حاول مرة أخرى
              </button>
            </div>
          </div>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');`}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}>
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 max-w-xl mx-auto w-full text-center">
        <h1 className="text-2xl sm:text-4xl font-bold" style={{ color: "#e8b86d", fontFamily: "'Cairo', sans-serif" }}>
          شخصيتك السينمائية
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          أجب على الأسئلة واكتشف من أنت من عالم السينما
        </p>
      </header>

      {/* Progress bar */}
      <div style={{ maxHeight: "100px", marginBottom: "20px", padding: "0 16px", maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #e8b86d, #c8843a)", borderRadius: "999px", transition: "width 0.3s ease" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "'Cairo', sans-serif" }}>
          <span>السؤال {step + 1} من {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question card */}
      <main className="flex-1 px-4 pb-12 max-w-xl mx-auto w-full">
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif", margin: "0 0 20px" }}>
            {QUESTIONS[step].question}
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {QUESTIONS[step].options.map(option => (
              <button
                key={option.val}
                onClick={() => handleSelect(QUESTIONS[step].id, option.val)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  border: answers[QUESTIONS[step].id] === option.val
                    ? "1px solid #e8b86d"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: answers[QUESTIONS[step].id] === option.val
                    ? "rgba(232,184,109,0.15)"
                    : "rgba(255,255,255,0.04)",
                  color: answers[QUESTIONS[step].id] === option.val ? "#fff" : "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "'Cairo', sans-serif",
                  textAlign: "right",
                  transition: "all 0.15s",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: step === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
              fontSize: "14px",
              cursor: step === 0 ? "not-allowed" : "pointer",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            السابق
          </button>
          {step === QUESTIONS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading || Object.keys(answers).length < QUESTIONS.length}
              style={{
                flex: 2,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: loading || Object.keys(answers).length < QUESTIONS.length
                  ? "rgba(232,184,109,0.3)"
                  : "linear-gradient(135deg, #e8b86d, #c8843a)",
                color: "#1a0f00",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading || Object.keys(answers).length < QUESTIONS.length ? "not-allowed" : "pointer",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {loading ? "جاري التحليل..." : "اكتشف شخصيتي!"}
            </button>
          ) : (
            <span style={{ flex: 2 }} />
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>
    </div>
  );
}
