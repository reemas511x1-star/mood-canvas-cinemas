import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useServerFn } from "@tanstack/react-start";
import { searchTmdb } from "@/lib/tmdb.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Plus, Trash2, Film, Tv, Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

type Item = {
  id: string;
  tmdb_id: number;
  media_type: "movie" | "tv" | "anime";
  title: string;
  poster_path: string | null;
  release_year: number | null;
  tmdb_rating: number | null;
  status: "watched" | "watching" | "plan";
  user_rating: number | null;
};

const STATUSES = ["all", "watching", "plan", "watched"] as const;

export function WatchGrid() {
  const { user, lang } = useApp();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const search = useServerFn(searchTmdb);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("watch_items").select("*").order("updated_at", { ascending: false });
    setItems((data ?? []) as Item[]);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const id = setTimeout(async () => {
      setSearching(true);
      try { setResults(await search({ data: { query: q, language: lang } })); }
      catch (e: any) { toast.error(e.message ?? "Search failed"); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(id);
  }, [q, lang, search]);

  const add = async (r: any) => {
    if (!user) return;
    const { error } = await supabase.from("watch_items").insert({
      user_id: user.id,
      tmdb_id: r.tmdb_id,
      media_type: r.media_type,
      title: r.title,
      original_title: r.original_title,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
      overview: r.overview,
      release_year: r.release_year,
      tmdb_rating: r.tmdb_rating,
      status: "plan",
    });
    if (error) {
      if (error.code === "23505") toast.info(lang === "ar" ? "موجود مسبقاً" : "Already in your vault");
      else toast.error(error.message);
    } else {
      toast.success(lang === "ar" ? "تمت الإضافة" : "Added");
      setQ(""); setResults([]);
      load();
    }
  };

  const updateStatus = async (id: string, status: Item["status"]) => {
    await supabase.from("watch_items").update({ status }).eq("id", id);
    load();
  };

  const rate = async (id: string, r: number) => {
    await supabase.from("watch_items").update({ user_rating: r }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("watch_items").delete().eq("id", id);
    load();
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const stats = {
    total: items.length,
    watched: items.filter(i => i.status === "watched").length,
    watching: items.filter(i => i.status === "watching").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t(lang, "totalTitles"), v: stats.total },
          { label: t(lang, "completed"), v: stats.watched },
          { label: t(lang, "inProgress"), v: stats.watching },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-gradient-cinema">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t(lang, "search")}
          className="ps-10 h-12 glass text-base" />
        {results.length > 0 && (
          <div className="absolute z-30 top-full mt-2 inset-x-0 glass-strong rounded-2xl p-2 max-h-96 overflow-y-auto shadow-2xl">
            {results.map(r => (
              <button key={`${r.media_type}-${r.tmdb_id}`} onClick={() => add(r)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-primary/10 text-start transition">
                {r.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} className="w-12 h-16 object-cover rounded-md" />
                  : <div className="w-12 h-16 rounded-md bg-muted grid place-items-center"><Film className="w-5 h-5"/></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {r.media_type === "movie" ? <Film className="w-3 h-3"/> : <Tv className="w-3 h-3"/>}
                    {r.release_year ?? "—"} · ★ {r.tmdb_rating?.toFixed?.(1) ?? "—"}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        )}
        {searching && <div className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">…</div>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className={filter === s ? "bg-[var(--gradient-cinema)] text-primary-foreground" : "glass"}>
            {s === "all" ? t(lang, "all") : t(lang, s as any)}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
          <p className="text-muted-foreground">{t(lang, "empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="group relative glass rounded-2xl overflow-hidden hover:scale-[1.03] hover:glow-cinema transition-all duration-300">
              <div className="aspect-[2/3] relative overflow-hidden">
                {item.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} className="w-full h-full object-cover" alt={item.title} />
                  : <div className="w-full h-full bg-muted grid place-items-center"><Film className="w-10 h-10 opacity-40"/></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className="absolute top-2 start-2 glass-strong text-xs">
                  {item.status === "watched" ? "✓" : item.status === "watching" ? "▶" : "+"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => remove(item.id)}
                  className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition glass-strong w-8 h-8">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <div className="font-medium text-sm truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{item.release_year ?? "—"}</span>
                  {item.tmdb_rating != null && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-primary text-primary"/>{item.tmdb_rating.toFixed(1)}</span>}
                </div>
                <div className="flex gap-1">
                  {(["plan","watching","watched"] as const).map(s => (
                    <button key={s} onClick={() => updateStatus(item.id, s)}
                      className={`flex-1 text-[10px] py-1 rounded-md transition ${item.status === s ? "bg-primary/20 text-primary" : "bg-muted/40 hover:bg-muted/70"}`}>
                      {s === "plan" ? (lang === "ar" ? "لاحقاً" : "Plan") : s === "watching" ? "▶" : "✓"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => rate(item.id, n)}>
                      <Star className={`w-3.5 h-3.5 ${(item.user_rating ?? 0) >= n ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}