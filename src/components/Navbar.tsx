import { Link } from "@tanstack/react-router";
import { BarChart3, Cloud, Globe, LogOut, Sparkles, User as UserIcon } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOOD_LABELS, WEATHER_LABELS } from "@/components/MoodBackground";
import type { MoodPreset, WeatherMood } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";

export function Navbar({ onSignInClick }: { onSignInClick?: () => void }) {
  const { user, lang, setLang, mood, setMood, weather, setWeather, signOut } = useApp();

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
          {/* Mood */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full glass" title={t(lang, "mood")}>
                <Cloud className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong w-64">
              <DropdownMenuLabel>{t(lang, "mood")}</DropdownMenuLabel>
              {(Object.keys(MOOD_LABELS) as MoodPreset[]).map(m => (
                <DropdownMenuItem key={m} onClick={() => setMood(m)}
                  className={mood === m ? "bg-primary/15 text-primary" : ""}>
                  {MOOD_LABELS[m][lang]}
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