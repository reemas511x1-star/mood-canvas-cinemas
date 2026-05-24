import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

export type ManualMood =
  | "midnight" | "ember" | "forest" | "cosmic" | "sand"
  | "arctic" | "sakura" | "storm" | "gold" | "void";

export type AutoMood =
  | "happy" | "sad" | "anxious" | "angry" | "excited"
  | "tired" | "lost" | "grateful" | "tense" | "ok";

export type MoodMode = "manual" | "auto";

// Back-compat alias used elsewhere
export type MoodPreset = ManualMood;
export type WeatherMood =
  | null | "sunny" | "stormy" | "cloudy" | "rainy" | "sandstorm" | "blizzard"
  | "thunder" | "night-rain" | "morning-rain" | "autumn";

const LEGACY_MOOD_MAP: Record<string, ManualMood> = {
  "masculine-dark": "midnight",
  "light": "sand",
  "feminine-vibrant": "sakura",
  "feminine-soft": "sakura",
  "neutral": "void",
  "dark": "midnight",
};

function normalizeManual(v: string | null | undefined): ManualMood {
  if (!v) return "midnight";
  if ((["midnight","ember","forest","cosmic","sand","arctic","sakura","storm","gold","void"] as const).includes(v as ManualMood)) {
    return v as ManualMood;
  }
  return LEGACY_MOOD_MAP[v] ?? "midnight";
}

function normalizeAuto(v: string | null | undefined): AutoMood {
  const all: AutoMood[] = ["happy","sad","anxious","angry","excited","tired","lost","grateful","tense","ok"];
  return (all as string[]).includes(v ?? "") ? (v as AutoMood) : "ok";
}

interface AppState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  lang: Lang;
  moodMode: MoodMode;
  mood: ManualMood;
  autoMood: AutoMood;
  weather: WeatherMood;
  setLang: (l: Lang) => void;
  setMoodMode: (m: MoodMode) => void;
  setMood: (m: ManualMood) => void;
  setAutoMood: (m: AutoMood) => void;
  setWeather: (w: WeatherMood) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>(
    typeof window !== "undefined" ? ((localStorage.getItem("vv_lang") as Lang) ?? "en") : "en",
  );
  const [moodMode, setMoodModeState] = useState<MoodMode>(
    typeof window !== "undefined" ? ((localStorage.getItem("vv_mood_mode") as MoodMode) ?? "manual") : "manual",
  );
  const [mood, setMoodState] = useState<ManualMood>(
    typeof window !== "undefined" ? normalizeManual(localStorage.getItem("vv_mood")) : "midnight",
  );
  const [autoMood, setAutoMoodState] = useState<AutoMood>(
    typeof window !== "undefined" ? normalizeAuto(localStorage.getItem("vv_auto_mood")) : "ok",
  );
  const [weather, setWeatherState] = useState<WeatherMood>(
    typeof window !== "undefined" ? ((localStorage.getItem("vv_weather") as WeatherMood) ?? null) : null,
  );

  const hydratePrefs = useCallback(async (uid: string) => {
    const { data } = await supabase.from("user_preferences").select("*").eq("user_id", uid).maybeSingle();
    if (data) {
      setLangState((data.language as Lang) ?? "en");
      setMoodState(normalizeManual(data.mood));
      setWeatherState((data.weather_mood as WeatherMood) ?? null);
      setMoodModeState(((data as any).mood_mode as MoodMode) ?? "manual");
      setAutoMoodState(normalizeAuto((data as any).auto_mood));
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => hydratePrefs(s.user.id), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) hydratePrefs(data.session.user.id);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [hydratePrefs]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("vv_lang", lang);
  }, [lang]);

  useEffect(() => { localStorage.setItem("vv_mood", mood); }, [mood]);
  useEffect(() => { localStorage.setItem("vv_auto_mood", autoMood); }, [autoMood]);
  useEffect(() => { localStorage.setItem("vv_mood_mode", moodMode); }, [moodMode]);
  useEffect(() => {
    if (weather) localStorage.setItem("vv_weather", weather);
    else localStorage.removeItem("vv_weather");
  }, [weather]);

  const persistPrefs = useCallback(async (patch: Partial<{ mood: ManualMood; weather: WeatherMood; language: Lang; moodMode: MoodMode; autoMood: AutoMood }>) => {
    if (!user) return;
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      mood: patch.mood ?? mood,
      weather_mood: patch.weather === undefined ? weather : patch.weather,
      language: patch.language ?? lang,
      mood_mode: patch.moodMode ?? moodMode,
      auto_mood: patch.autoMood ?? autoMood,
    } as any, { onConflict: "user_id" });
  }, [user, mood, weather, lang, moodMode, autoMood]);

  const setLang = (l: Lang) => { setLangState(l); persistPrefs({ language: l }); };
  const setMood = (m: ManualMood) => { setMoodState(m); persistPrefs({ mood: m }); };
  const setAutoMood = (m: AutoMood) => { setAutoMoodState(m); persistPrefs({ autoMood: m }); };
  const setMoodMode = (m: MoodMode) => { setMoodModeState(m); persistPrefs({ moodMode: m }); };
  const setWeather = (w: WeatherMood) => { setWeatherState(w); persistPrefs({ weather: w }); };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ user, session, loading, lang, moodMode, mood, autoMood, weather, setLang, setMoodMode, setMood, setAutoMood, setWeather, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}