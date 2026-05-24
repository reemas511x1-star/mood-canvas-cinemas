import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Cloud, Globe, LogOut, Sparkles, User as UserIcon, Wand2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MANUAL_MOOD_LABELS, AUTO_MOOD_LABELS, WEATHER_LABELS,
} from "@/components/MoodBackground";
import type { ManualMood, AutoMood, WeatherMood } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { detectMood } from "@/lib/ai.functions";
import { toast } from "sonner";

export function Navbar({ onSignInClick }: { onSignInClick?: () => void }) {
  const { user, lang, setLang, moodMode, setMoodMode, mood, setMood, autoMood, setAutoMood, weather, setWeather, signOut } = useApp();
  const [feeling, setFeeling] = useState("");
  const [detecting, setDetecting] = useState(false);
  const detect = useServerFn(detectMood);

  const runDetect = async () => {
    const text = feeling.trim();
    if (!text) return;
    setDetecting(true);
    try {
      const { mood: m } = await detect({ data: { text, language: lang } });
      setAutoMood(m);
      toast.success(lang === "ar" ? `الجو الآن: ${AUTO_MOOD_LABELS[m].ar}` : `Detected: ${AUTO_MOOD_LABELS[m].en}`);
    } catch (e) {
      toast.error(lang === "ar" ? "تعذّر اكتشاف المزاج" : "Could not detect mood");
    } finally {
      setDetecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-[var(--glass-border)]">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 rounded-xl bg-[var(--gradient-cinema)] grid place-items-center glow-cinema">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">
            <span className="text-gradient-cinema">{t(lang, "appName")}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link to="/stats" className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full glass hover:bg-primary/15 transition">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === "ar" ? "إحصاءات" : "Stats"}</span>
            </Link>
          )}

          {/* Mood menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full glass" title={t(lang, "mood")}>
                {moodMode === "auto" ? <Wand2 className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong w-72">
              {/* Mode toggle */}
              <div className="px-2 py-2 flex gap-1">
                <Button size="sm" variant={moodMode === "manual" ? "default" : "ghost"}
                  className="flex-1 text-xs" onClick={() => setMoodMode("manual")}>
                  {lang === "ar" ? "مودي أنا" : "My Mood"}
                </Button>
                <Button size="sm" variant={moodMode === "auto" ? "default" : "ghost"}
                  className="flex-1 text-xs" onClick={() => setMoodMode("auto")}>
                  {lang === "ar" ? "مود مزاجي" : "Auto Mood"}
                </Button>
              </div>
              <DropdownMenuSeparator />

              {moodMode === "manual" ? (
                <>
                  <DropdownMenuLabel>{lang === "ar" ? "الثيمات" : "Themes"}</DropdownMenuLabel>
                  {(Object.keys(MANUAL_MOOD_LABELS) as ManualMood[]).map(m => (
                    <DropdownMenuItem key={m} onClick={() => setMood(m)}
                      className={mood === m ? "bg-primary/15 text-primary" : ""}>
                      {MANUAL_MOOD_LABELS[m][lang]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t(lang, "weather")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setWeather(null)}
                    className={!weather ? "bg-primary/15 text-primary" : ""}>
                    {lang === "ar" ? "بدون" : "None"}
                  </DropdownMenuItem>
                  {(Object.keys(WEATHER_LABELS) as NonNullable<WeatherMood>[]).map(w => (
                    <DropdownMenuItem key={w} onClick={() => setWeather(w)}
                      className={weather === w ? "bg-primary/15 text-primary" : ""}>
                      {WEATHER_LABELS[w][lang]}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                <>
                  <DropdownMenuLabel>{lang === "ar" ? "كيف تشعر؟" : "How are you feeling?"}</DropdownMenuLabel>
                  <div className="px-2 pb-2 space-y-2" onClick={(e) => e.stopPropagation()}
                       onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                      value={feeling}
                      onChange={(e) => setFeeling(e.target.value)}
                      placeholder={lang === "ar" ? "اكتب شعورك بحرية…" : "Type freely…"}
                      onKeyDown={(e) => { if (e.key === "Enter") runDetect(); }}
                      className="text-sm"
                      disabled={detecting}
                    />
                    <Button size="sm" className="w-full" onClick={runDetect} disabled={detecting || !feeling.trim()}>
                      {detecting ? (lang === "ar" ? "يحلّل…" : "Detecting…") : (lang === "ar" ? "اكتشف مزاجي" : "Detect my mood")}
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{lang === "ar" ? "اختر يدوياً" : "Or pick directly"}</DropdownMenuLabel>
                  {(Object.keys(AUTO_MOOD_LABELS) as AutoMood[]).map(m => (
                    <DropdownMenuItem key={m} onClick={() => setAutoMood(m)}
                      className={autoMood === m ? "bg-primary/15 text-primary" : ""}>
                      {AUTO_MOOD_LABELS[m][lang]}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language */}
          <Button variant="ghost" size="icon" className="rounded-full glass"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            <Globe className="w-4 h-4" />
            <span className="sr-only">{t(lang, "language")}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full glass">
                  <UserIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong w-56">
                <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 me-2" /> {t(lang, "logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={onSignInClick} className="rounded-full bg-[var(--gradient-cinema)] text-primary-foreground glow-cinema hover:opacity-90">
              {t(lang, "signIn")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}