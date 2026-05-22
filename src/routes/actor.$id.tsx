import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchPerson } from "@/lib/tmdb.functions";
import { Navbar } from "@/components/Navbar";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export const Route = createFileRoute("/actor/$id")({ component: ActorPage });

function ActorPage() {
  const { id } = useParams({ from: "/actor/$id" });
  const { lang } = useApp();
  const get = useServerFn(fetchPerson);
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    get({ data: { person_id: Number(id), language: lang } })
      .then(setP).catch((e) => toast.error(e.message));
  }, [id, lang, get]);

  if (!p) return <div className="min-h-screen"><Navbar /><div className="container mx-auto p-10 text-muted-foreground">Loading…</div></div>;

  const credits = (p.combined_credits?.cast ?? [])
    .filter((c: any) => c.media_type === "movie" || c.media_type === "tv")
    .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 24);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
        <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
          {p.profile_path && (
            <img src={`https://image.tmdb.org/t/p/w500${p.profile_path}`} alt={p.name}
              className="w-full rounded-3xl glass-strong glow-cinema" />
          )}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient-cinema">{p.name}</span></h1>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
              {p.known_for_department && <span>{p.known_for_department}</span>}
              {p.birthday && <span>{p.birthday}{p.place_of_birth ? ` · ${p.place_of_birth}` : ""}</span>}
            </div>
            {p.biography && (
              <p className="text-foreground/85 leading-relaxed line-clamp-[12]">{p.biography}</p>
            )}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">{lang === "ar" ? "أبرز الأعمال" : "Known for"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {credits.map((c: any) => (
              <Link key={`${c.media_type}-${c.id}-${c.credit_id}`} to="/title/$type/$id"
                params={{ type: c.media_type, id: String(c.id) }}
                className="glass rounded-2xl overflow-hidden hover:scale-[1.04] hover:glow-cinema transition">
                {c.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w342${c.poster_path}`} alt={c.title ?? c.name}
                    className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted" />
                )}
                <div className="p-2">
                  <div className="text-xs font-medium truncate">{c.title ?? c.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{c.character}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}