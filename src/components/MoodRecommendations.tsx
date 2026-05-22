import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getMoodRecommendations } from "@/lib/ai.functions";
import { tmdbTitleByQuery } from "@/lib/tmdb.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Film, Tv, Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Pick = { title: string; year: number | null; type: "movie" | "tv"; why: string };
type Enriched = Pick & { tmdb?: any };

export function MoodRecommendations() {
  const { lang, mood, weather, user } = useApp();
  const recommend = useServerFn(getMoodRecommendations);
  const lookup = useServerFn(tmdbTitleByQuery);
  const [picks, setPicks] = useState<Enriched[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setPicks([]);
    try {
      const { picks } = await recommend({ data: { mood, weather, language: lang } });
      const enriched = await Promise.all(
        (picks as Pick[]).map(async (p) => {
          const q = `${p.title}${p.year ? ` ${p.year}` : ""}`;
          const tmdb = await lookup({ data: { query: q, language: lang } });
          return { ...p, tmdb };
        }),
      );
      setPicks(enriched);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("429")) toast.error(lang === "ar" ? "حد الاستخدام مؤقت، حاول لاحقاً" : "Rate limit, try again soon");
      else if (msg.includes("402")) toast.error(lang === "ar" ? "رصيد الذكاء الاصطناعي منتهي" : "AI credits exhausted");
      else toast.error(msg || "Failed");
    } finally { setBusy(false); }
  };

  const add = async (p: Enriched) => {
    if (!user || !p.tmdb) return;
    const r = p.tmdb;
    const { error } = await supabase.from("watch_items").insert({
      user_id: user.id,
      tmdb_id: r.tmdb_id, media_type: r.media_type, title: r.title,
      poster_path: r.poster_path, backdrop_path: r.backdrop_path,
      overview: r.overview, release_year: r.release_year, tmdb_rating: r.tmdb_rating,
      status: "plan",
    });
    if (error && error.code !== "23505") toast.error(error.message);
    else toast.success(lang === "ar" ? "أُضيف للمكتبة" : "Added to vault");
  };

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--gradient-cinema)] grid place-items-center glow-cinema">
            <Wand2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{lang === "ar" ? "توصيات على المزاج" : "Mood-tuned picks"}</h2>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "ذكاء اصطناعي يقرأ مزاجك وذوقك" : "AI reads your mood and taste"}
            </p>
          </div>
        </div>
        <Button onClick={run} disabled={busy} className="bg-[var(--gradient-cinema)] text-primary-foreground glow-cinema">
          <Sparkles className="w-4 h-4 me-2" />
          {busy ? (lang === "ar" ? "جارٍ التنسيق…" : "Curating…") : (lang === "ar" ? "اقترح لي" : "Suggest")}
        </Button>
      </div>

      {picks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "اضغط اقترح لي لتلقي 6 عناوين منسّقة على مزاجك الحالي."
            : "Hit Suggest to receive 6 titles tuned to your current mood."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {picks.map((p, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden group">
              {p.tmdb?.poster_path ? (
                <Link to="/title/$type/$id" params={{ type: p.tmdb.media_type, id: String(p.tmdb.tmdb_id) }}>
                  <img src={`https://image.tmdb.org/t/p/w342${p.tmdb.poster_path}`}
                    alt={p.title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition" />
                </Link>
              ) : (
                <div className="w-full aspect-[2/3] bg-muted grid place-items-center">
                  {p.type === "movie" ? <Film className="w-10 h-10 opacity-40"/> : <Tv className="w-10 h-10 opacity-40"/>}
                </div>
              )}
              <div className="p-3 space-y-2">
                <div className="font-medium text-sm truncate">{p.title}{p.year ? ` · ${p.year}` : ""}</div>
                <p className="text-[11px] text-muted-foreground line-clamp-3">{p.why}</p>
                {p.tmdb && (
                  <Button size="sm" variant="ghost" onClick={() => add(p)} className="w-full text-xs glass">
                    <Plus className="w-3 h-3 me-1" /> {lang === "ar" ? "أضف" : "Add"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}