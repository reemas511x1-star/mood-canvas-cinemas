import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMovieCountry, type MovieCountry } from "@/lib/travel.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/travel")({ component: TravelPage });

const REGION_COLORS: Record<string, string> = {
  "أوروبا": "#4db8ff",
  "آسيا": "#ff6b9d",
  "أفريقيا": "#f0a830",
  "أمريكا": "#22c55e",
  "أمريكا الجنوبية": "#22c55e",
  "الشرق الأوسط": "#e8b86d",
  "الشرق الأوسط وشمال أفريقيا": "#e8b86d",
  "أستراليا": "#b04dff",
};

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("travel_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("travel_session", id);
  }
  return id;
}

type Stamp = {
  id: string;
  title: string;
  title_ar: string;
  type: string;
  country: string;
  country_ar: string;
  region: string;
  poster_url: string;
  watched_at: string;
  created_at: string;
};

export default function TravelPage() {
  const [movieName, setMovieName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const getCountry = useServerFn(getMovieCountry);

  const loadStamps = async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("travel_stamps")
      .select("*")
      .eq("session_id", sessionId)
      .order("watched_at", { ascending: false });
    setStamps((data ?? []) as Stamp[]);
  };

  useEffect(() => {
    loadStamps();
  }, []);

  const countries = Array.from(new Set(stamps.map(s => s.country)));
  const regions = Array.from(new Set(stamps.map(s => s.region).filter(Boolean)));

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieName.trim() || loading) return;

    setLoading(true);
    try {
      const { info } = await getCountry({ data: { movieName: movieName.trim() } });
      const sessionId = getSessionId();

      const { error } = await supabase.from("travel_stamps").insert({
        session_id: sessionId,
        title: info.title,
        title_ar: info.titleAr,
        type: info.type,
        country: info.country,
        country_ar: info.countryAr,
        region: info.region,
        poster_url: info.posterUrl || "",
      });

      if (error) {
        toast.error("حدث خطأ في الحفظ");
      } else {
        toast.success(`تم إضافة ${info.titleAr} واكتشاف ${info.countryAr}`);
        setMovieName("");
        setShowAddForm(false);
        loadStamps();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const sessionId = getSessionId();
    await supabase.from("travel_stamps").delete().eq("id", id).eq("session_id", sessionId);
    loadStamps();
    toast.success("تم حذف العمل");
  };

  const getRegionColor = (region: string) => {
    for (const [key, color] of Object.entries(REGION_COLORS)) {
      if (region?.includes(key)) return color;
    }
    return "#e8b86d";
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0d0d14 0%, #100d18 50%, #0a0f17 100%)" }}>
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ color: "#e8b86d", fontFamily: "'Cairo', sans-serif" }}>
              سافر بالأفلام
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              كل فيلم = ختم جديد في جوازك السينمائي
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
            {showAddForm ? "إلغاء" : "أضف عمل جديد +"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", fontWeight: "800", color: "#e8b86d", fontFamily: "'Cairo', sans-serif", lineHeight: 1 }}>
              {countries.length}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginTop: "6px" }}>
              دولة تمت زيارتها
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", fontWeight: "800", color: "#ff6b9d", fontFamily: "'Cairo', sans-serif", lineHeight: 1 }}>
              {stamps.length}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginTop: "6px" }}>
              عمل مشاهَد
            </div>
          </div>
        </div>

        {/* Regions badges */}
        {regions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {regions.map(region => (
              <span
                key={region}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  background: `${getRegionColor(region)}20`,
                  border: `1px solid ${getRegionColor(region)}40`,
                  color: getRegionColor(region),
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {region}
              </span>
            ))}
          </div>
        )}

        {/* Add Movie Form */}
        {showAddForm && (
          <form onSubmit={handleAddMovie} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", marginBottom: "10px" }}>
              اكتب اسم الفيلم أو المسلسل:
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={movieName}
                onChange={e => setMovieName(e.target.value)}
                placeholder="مثال: Parasite, Spirited Away, City of God..."
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                  padding: "14px 16px",
                  outline: "none",
                  fontFamily: "'Cairo', sans-serif",
                }}
              />
              <button
                type="submit"
                disabled={loading || !movieName.trim()}
                style={{
                  background: loading || !movieName.trim()
                    ? "rgba(232,184,109,0.3)"
                    : "linear-gradient(135deg, #e8b86d, #c8843a)",
                  color: loading || !movieName.trim() ? "rgba(255,255,255,0.4)" : "#1a0f00",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 24px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: loading || !movieName.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {loading ? "..." : "أضف"}
              </button>
            </div>
          </form>
        )}

        {/* Countries Map Grid */}
        {countries.length > 0 && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: "700", color: "rgba(255,255,255,0.6)", fontFamily: "'Cairo', sans-serif", margin: "0 0 16px" }}>
              الدول المكتشفة ({countries.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px" }}>
              {countries.map(country => {
                const sample = stamps.find(s => s.country === country);
                const color = getRegionColor(sample?.region || "");
                const count = stamps.filter(s => s.country === country).length;
                return (
                  <div
                    key={country}
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      borderRadius: "16px",
                      padding: "14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>
                      {country === "United States" || country === "USA" ? "🇺🇸" :
                       country === "Japan" ? "🇯🇵" :
                       country === "South Korea" ? "🇰🇷" :
                       country === "France" ? "🇫🇷" :
                       country === "United Kingdom" ? "🇬🇧" :
                       country === "Germany" ? "🇩🇪" :
                       country === "India" ? "🇮🇳" :
                       country === "China" ? "🇨🇳" :
                       country === "Italy" ? "🇮🇹" :
                       country === "Spain" ? "🇪🇸" :
                       country === "Mexico" ? "🇲🇽" :
                       country === "Brazil" ? "🇧🇷" :
                       country === "Argentina" ? "🇦🇷" :
                       country === "Egypt" ? "🇪🇬" :
                       country === "Turkey" ? "🇹🇷" :
                       country === "Iran" ? "🇮🇷" :
                       country === "Lebanon" ? "🇱🇧" :
                       country === "South Africa" ? "🇿🇦" :
                       country === "Australia" ? "🇦🇺" :
                       country === "Canada" ? "🇨🇦" :
                       country === "Russia" ? "🇷🇺" :
                       country === "Thailand" ? "🇹🇭" :
                       "🌍"}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif" }}>
                      {sample?.country_ar || country}
                    </div>
                    <div style={{ fontSize: "11px", color: color, fontFamily: "'Cairo', sans-serif" }}>
                      {count} {count === 1 ? "عمل" : "أعمال"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stamps List */}
        {stamps.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700", color: "rgba(255,255,255,0.6)", fontFamily: "'Cairo', sans-serif", margin: 0 }}>
                جوازك السينمائي ({stamps.length} ختم)
              </h2>
            </div>
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {stamps.map((stamp, i) => {
                const color = getRegionColor(stamp.region);
                return (
                  <div
                    key={stamp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px 20px",
                      borderBottom: i < stamps.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <div style={{ width: "50px", height: "50px", borderRadius: "14px", overflow: "hidden", flexShrink: 0, background: `${color}20` }}>
                      {stamp.poster_url ? (
                        <img src={stamp.poster_url} alt={stamp.title_ar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "24px" }}>🎬</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", fontFamily: "'Cairo', sans-serif", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {stamp.title_ar}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: color, fontFamily: "'Cairo', sans-serif" }}>
                          {stamp.country_ar}
                        </span>
                        <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
                          {stamp.type === "movie" ? "فيلم" : stamp.type === "anime" ? "أنمي" : "مسلسل"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(stamp.id)}
                      style={{ background: "rgba(255,255,255,0.04)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stamps.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(255,255,255,0.3)", fontFamily: "'Cairo', sans-serif" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌍</div>
            <p style={{ fontSize: "16px", margin: "0" }}>لم تكتشف أي دولة بعد</p>
            <p style={{ fontSize: "14px", margin: "8px 0 0", color: "rgba(255,255,255,0.2)" }}>
              ابدأ بإضافة فيلم لتحصل على أول ختم في جوازك!
            </p>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        input::placeholder { color: rgba(255,255,255,0.25); }
        input { caret-color: #e8b86d; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>
    </div>
  );
}
