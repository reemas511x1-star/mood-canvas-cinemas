import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchTmdbDetails } from "@/lib/tmdb.functions";
import { Navbar } from "@/components/Navbar";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, Plus, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/title/$type/$id")({ component: TitleDetail });

function TitleDetail() {
  const { type, id } = useParams({ from: "/title/$type/$id" });
  const { lang, user } = useApp();
  const get = useServerFn(fetchTmdbDetails);
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    if (type !== "movie" && type !== "tv") return;
    get({ data: { tmdb_id: Number(id), media_type: type as "movie" | "tv", language: lang } })
      .then(setD).catch((e) => toast.error(e.message));
  }, [id, type, lang, get]);

  const add = async () => {
    if (!user || !d) return;
    const { error } = await supabase.from("watch_items").insert({
      user_id: user.id, tmdb_id: d.id, media_type: type,
      title: d.title ?? d.name,
      original_title: d.original_title ?? d.original_name,
      poster_path: d.poster_path, backdrop_path: d.backdrop_path,
      overview: d.overview,
      release_year: parseInt(((d.release_date ?? d.first_air_date) ?? "").slice(0, 4), 10) || null,
      tmdb_rating: d.vote_average ?? null,
      genres: (d.genres ?? []).map((g: any) => g.name),
      status: "plan",
    });
    if (error && error.code !== "23505") toast.error(error.message);
    else toast.success(lang === "ar" ? "أُضيف" : "Added");
  };

  if (!d) return <div className="min-h-screen"><Navbar /><div className="container mx-auto p-10 text-muted-foreground">Loading…</div></div>;

  const title = d.title ?? d.name;
  const year = ((d.release_date ?? d.first_air_date) ?? "").slice(0, 4);
  const cast = (d.credits?.cast ?? []).slice(0, 12);

  return (
    <div className="min-h-screen">
      <Navbar />
      {d.backdrop_path && (
        <div className="relative h-[40vh] -mb-32 overflow-hidden">
          <img src={`https://image.tmdb.org/t/p/original${d.backdrop_path}`} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl relative">
        <div className="grid md:grid-cols-[260px_1fr] gap-8 items-start">
          {d.poster_path && (
            <img src={`https://image.tmdb.org/t/p/w500${d.poster_path}`} alt={title}
              className="w-full rounded-3xl glass-strong glow-cinema" />
          )}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient-cinema">{title}</span></h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {year && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{year}</span>}
              {d.runtime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{d.runtime}m</span>}
              {d.vote_average != null && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />{d.vote_average.toFixed(1)}</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(d.genres ?? []).map((g: any) => (
                <span key={g.id} className="glass rounded-full px-3 py-1 text-xs">{g.name}</span>
              ))}
            </div>
            <p className="text-base leading-relaxed text-foreground/85">{d.overview}</p>
            {user && (
              <Button onClick={add} className="bg-[var(--gradient-cinema)] text-primary-foreground glow-cinema">
                <Plus className="w-4 h-4 me-2" /> {lang === "ar" ? "أضف للمكتبة" : "Add to vault"}
              </Button>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">{lang === "ar" ? "طاقم العمل" : "Cast"}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {cast.map((c: any) => (
                <Link key={c.id} to="/actor/$id" params={{ id: String(c.id) }}
                  className="glass rounded-2xl overflow-hidden hover:scale-[1.04] hover:glow-cinema transition group">
                  {c.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name}
                      className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted" />
                  )}
                  <div className="p-2">
                    <div className="text-xs font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.character}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}