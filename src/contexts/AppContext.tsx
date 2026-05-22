import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

export type MoodPreset =
  | "masculine-dark" | "light" | "feminine-vibrant" | "feminine-soft" | "neutral" | "dark";
export type WeatherMood =
  | null | "sunny" | "stormy" | "cloudy" | "rainy" | "sandstorm" | "blizzard"
  | "thunder" | "night-rain" | "morning-rain" | "autumn";

interface AppState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  lang: Lang;
  mood: MoodPreset;
  weather: WeatherMood;
  setLang: (l: Lang) => void;
  setMood: (m: MoodPreset) => void;
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
  const [mood, setMoodState] = useState<MoodPreset>(
    typeof window !== "undefined" ? ((localStorage.getItem("vv_mood") as MoodPreset) ?? "dark") : "dark",
  );
  const [weather, setWeatherState] = useState<WeatherMood>(
    typeof window !== "undefined" ? ((localStorage.getItem("vv_weather") as WeatherMood) ?? null) : null,
  );

  // Hydrate from DB once signed in
  const hydratePrefs = useCallback(async (uid: string) => {
    const { data } = await supabase.from("user_preferences").select("*").eq("user_id", uid).maybeSingle();
    if (data) {
      setLangState((data.language as Lang) ?? "en");
      setMoodState((data.mood as MoodPreset) ?? "dark");
      setWeatherState((data.weather_mood as WeatherMood) ?? null);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer
        setTimeout(() => hydratePrefs(s.user.id), 0);
      }
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
  useEffect(() => {
    if (weather) localStorage.setItem("vv_weather", weather);
    else localStorage.removeItem("vv_weather");
  }, [weather]);

  const persistPrefs = useCallback(async (patch: { mood?: MoodPreset; weather?: WeatherMood; language?: Lang }) => {
    if (!user) return;
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      mood: patch.mood ?? mood,
      weather_mood: patch.weather === undefined ? weather : patch.weather,
      language: patch.language ?? lang,
    }, { onConflict: "user_id" });
  }, [user, mood, weather, lang]);

  const setLang = (l: Lang) => { setLangState(l); persistPrefs({ language: l }); };
  const setMood = (m: MoodPreset) => { setMoodState(m); persistPrefs({ mood: m }); };
  const setWeather = (w: WeatherMood) => { setWeatherState(w); persistPrefs({ weather: w }); };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ user, session, loading, lang, mood, weather, setLang, setMood, setWeather, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}