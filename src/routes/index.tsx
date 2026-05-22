import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/contexts/AppContext";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { Sparkles, Film, Tv, Cloud } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading, lang } = useApp();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <Navbar onSignInClick={() => setAuthOpen(true)} />
      <main className="container mx-auto px-4 sm:px-6 pt-20 pb-24">
        <section className="max-w-4xl mx-auto text-center space-y-8" style={{ animation: "float-up 0.9s ease-out" }}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {lang === "ar" ? "تجربة سينمائية" : "A cinematic experience"}
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.95]">
            <span className="text-gradient-cinema">{t(lang, "appName")}</span>
          </h1>
          <p className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t(lang, "heroSub")}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => setAuthOpen(true)}
              className="rounded-full h-14 px-8 text-base bg-[var(--gradient-cinema)] text-primary-foreground glow-cinema hover:opacity-90">
              {t(lang, "getStarted")}
            </Button>
          </div>
        </section>

        <section className="mt-32 grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { icon: Film, t: lang === "ar" ? "تتبّع كل شيء" : "Track everything", d: lang === "ar" ? "أفلام ومسلسلات وأنمي من TMDB." : "Movies, series and anime from TMDB." },
            { icon: Cloud, t: lang === "ar" ? "أجواء مزاجية" : "Mood atmospheres", d: lang === "ar" ? "خلفيات سينمائية حية تتبدّل مع مزاجك." : "Live cinematic backgrounds that match your mood." },
            { icon: Tv, t: lang === "ar" ? "بياناتك فقط" : "Yours alone", d: lang === "ar" ? "عزل تام — بريد واحد، مكتبة واحدة في كل أجهزتك." : "Total isolation — same email, same library, every device." },
          ].map((f, i) => (
            <div key={i} className="glass rounded-3xl p-6 hover:glow-cinema transition-all">
              <f.icon className="w-7 h-7 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-1">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
