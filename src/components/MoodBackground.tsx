import { useEffect, useRef } from "react";
import { useApp, type ManualMood, type AutoMood, type WeatherMood } from "@/contexts/AppContext";

type ThemeKey = ManualMood | AutoMood;

const GRADIENTS: Record<ThemeKey, string> = {
  // Manual
  midnight: "radial-gradient(1200px 800px at 50% 0%, #0a0f1f 0%, #04060d 60%, #000 100%)",
  ember:    "radial-gradient(1200px 800px at 50% 100%, #4a1500 0%, #1d0700 60%, #0a0200 100%)",
  forest:   "radial-gradient(1200px 800px at 30% 20%, #0c2a18 0%, #06170d 60%, #020806 100%)",
  cosmic:   "radial-gradient(1200px 800px at 70% 0%, #2a0b5a 0%, #0e0830 60%, #04021a 100%)",
  sand:     "radial-gradient(1200px 800px at 50% 0%, #3a2e1c 0%, #1d1610 60%, #0c0907 100%)",
  arctic:   "radial-gradient(1200px 800px at 50% 0%, #e8f4fb 0%, #b3d4e8 60%, #6892b0 100%)",
  sakura:   "radial-gradient(1200px 800px at 50% 0%, #3d1a2a 0%, #1e0e18 60%, #0c060a 100%)",
  storm:    "radial-gradient(1200px 800px at 50% 0%, #1a1d22 0%, #0c0e12 60%, #050608 100%)",
  gold:     "radial-gradient(1200px 800px at 50% 0%, #3a2a08 0%, #1a1304 60%, #0a0702 100%)",
  void:     "radial-gradient(1200px 800px at 50% 50%, #050505 0%, #000 100%)",
  // Auto
  happy:    "radial-gradient(1200px 800px at 50% 0%, #fff1c4 0%, #ffb86b 50%, #f06a3a 100%)",
  sad:      "radial-gradient(1200px 800px at 50% 0%, #c9d8e8 0%, #8aa2bc 60%, #4a607a 100%)",
  anxious:  "radial-gradient(1200px 800px at 50% 50%, #1c1d20 0%, #0f1012 100%)",
  angry:    "radial-gradient(1200px 800px at 50% 0%, #6b0a0a 0%, #2a0303 60%, #100000 100%)",
  excited:  "radial-gradient(1200px 800px at 30% 20%, #ff3da6 0%, #6c2bd9 50%, #1b0a45 100%)",
  tired:    "radial-gradient(1200px 800px at 50% 100%, #2a2a30 0%, #18181d 60%, #0a0a0d 100%)",
  lost:     "radial-gradient(1200px 800px at 50% 50%, #4a4a55 0%, #2a2a30 60%, #14141a 100%)",
  grateful: "radial-gradient(1200px 800px at 50% 0%, #c9a04c 0%, #5a3c10 60%, #1d1305 100%)",
  tense:    "radial-gradient(1200px 800px at 50% 0%, #1a3a5a 0%, #0a1d33 60%, #03091a 100%)",
  ok:       "radial-gradient(1200px 800px at 50% 0%, #1f3a2d 0%, #112018 60%, #060a08 100%)",
};

type Particle = { x: number; y: number; vx: number; vy: number; size: number; life: number; rot?: number; vr?: number; hue?: number };

// Particle behavior key — collapses themes to a small set of effects
type FxKey =
  | "stars" | "embers" | "leaves-green" | "nebula" | "dust"
  | "snow" | "petals" | "rain-storm" | "glints" | "none"
  | "sparkle" | "drizzle" | "fog" | "glow" | "shimmer";

const FX: Record<ThemeKey, FxKey> = {
  midnight: "stars",
  ember: "embers",
  forest: "leaves-green",
  cosmic: "nebula",
  sand: "dust",
  arctic: "snow",
  sakura: "petals",
  storm: "rain-storm",
  gold: "glints",
  void: "none",
  happy: "sparkle",
  sad: "drizzle",
  anxious: "none",
  angry: "embers",
  excited: "nebula",
  tired: "none",
  lost: "fog",
  grateful: "glow",
  tense: "none",
  ok: "shimmer",
};

export function MoodBackground() {
  const { moodMode, mood, autoMood, weather } = useApp();
  const activeTheme: ThemeKey = moodMode === "auto" ? autoMood : mood;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const flashRef = useRef<number>(0);

  // Apply weather overlay particles only in manual mode + when chosen
  const activeWeather: WeatherMood = moodMode === "manual" ? weather : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    setSize();
    window.addEventListener("resize", setSize);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const fx = FX[activeTheme];
    const particles: Particle[] = [];
    const seed = (n: number, fn: () => Particle) => { for (let i = 0; i < n; i++) particles.push(fn()); };
    const W0 = W(); const H0 = H();

    // Theme particles
    switch (fx) {
      case "stars":
        seed(140, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: 0, size: Math.random()*1.5+0.3, life: Math.random() })); break;
      case "embers":
        seed(80, () => ({ x: Math.random()*W0, y: H0+Math.random()*100, vx: -0.2+Math.random()*0.4, vy: -0.5-Math.random()*1.2, size: 1+Math.random()*2, life: 1 })); break;
      case "leaves-green":
        seed(40, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -0.5+Math.random(), vy: 0.6+Math.random(), size: 5+Math.random()*7, life: 1, rot: Math.random()*6, vr: -0.05+Math.random()*0.1, hue: 90+Math.random()*40 })); break;
      case "nebula":
        seed(120, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -0.1+Math.random()*0.2, vy: -0.1+Math.random()*0.2, size: Math.random()*2+0.5, life: Math.random(), hue: 260+Math.random()*60 })); break;
      case "dust":
        seed(180, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -1.5-Math.random()*1.5, vy: -0.2+Math.random()*0.4, size: 1+Math.random()*1.5, life: 1, hue: 35+Math.random()*15 })); break;
      case "snow":
        seed(200, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -1+Math.random()*2, vy: 0.8+Math.random()*1.8, size: 1.5+Math.random()*2.5, life: 1 })); break;
      case "petals":
        seed(50, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -0.4+Math.random()*0.8, vy: 0.8+Math.random()*1.2, size: 5+Math.random()*6, life: 1, rot: Math.random()*6, vr: -0.04+Math.random()*0.08 })); break;
      case "rain-storm":
        seed(260, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -2, vy: 13+Math.random()*6, size: 1+Math.random(), life: 1 })); break;
      case "glints":
        seed(60, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: 0, size: 1+Math.random()*2, life: Math.random() })); break;
      case "sparkle":
        seed(100, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: -0.3-Math.random()*0.4, size: 1.5+Math.random()*2, life: Math.random(), hue: 30+Math.random()*40 })); break;
      case "drizzle":
        seed(120, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -0.5, vy: 5+Math.random()*3, size: 1, life: 1 })); break;
      case "fog":
        seed(8, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0.15+Math.random()*0.2, vy: 0, size: 240+Math.random()*200, life: 1 })); break;
      case "glow":
        seed(50, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: -0.2-Math.random()*0.3, size: 2+Math.random()*3, life: Math.random(), hue: 40+Math.random()*15 })); break;
      case "shimmer":
        seed(60, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: 0, size: 1+Math.random()*1.5, life: Math.random(), hue: 140+Math.random()*40 })); break;
      case "none": break;
    }

    // Weather overlay particles (manual mode only)
    const wParts: Particle[] = [];
    const wSeed = (n: number, fn: () => Particle) => { for (let i = 0; i < n; i++) wParts.push(fn()); };
    switch (activeWeather) {
      case "rainy": case "morning-rain": case "night-rain":
        wSeed(200, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -2, vy: 12+Math.random()*6, size: 1+Math.random(), life: 1 })); break;
      case "stormy": case "thunder":
        wSeed(280, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -3, vy: 14+Math.random()*6, size: 1+Math.random(), life: 1 })); break;
      case "blizzard":
        wSeed(240, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -2+Math.random()*4, vy: 1+Math.random()*3, size: 1.5+Math.random()*3, life: 1 })); break;
      case "cloudy":
        wSeed(7, () => ({ x: Math.random()*W0, y: Math.random()*H0*0.6, vx: 0.2+Math.random()*0.3, vy: 0, size: 200+Math.random()*180, life: 1 })); break;
      case "sandstorm":
        wSeed(380, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -6-Math.random()*4, vy: -0.5+Math.random(), size: 1+Math.random()*2, life: 1, hue: 30+Math.random()*20 })); break;
      case "autumn":
        wSeed(60, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: -0.5+Math.random(), vy: 1+Math.random()*1.5, size: 6+Math.random()*8, life: 1, rot: Math.random()*6, vr: -0.05+Math.random()*0.1, hue: 20+Math.random()*30 })); break;
      case "sunny":
        wSeed(40, () => ({ x: Math.random()*W0, y: Math.random()*H0, vx: 0, vy: -0.3-Math.random()*0.4, size: 2+Math.random()*2, life: Math.random() })); break;
      default: break;
    }

    const draw = () => {
      const WW = W(); const HH = H();
      ctx.clearRect(0, 0, WW, HH);

      // Lightning for storm theme or thunder weather
      const wantsThunder = fx === "rain-storm" || activeWeather === "thunder" || activeWeather === "stormy";
      if (wantsThunder && Math.random() < 0.003) flashRef.current = 1;
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(220,230,255,${flashRef.current*0.32})`;
        ctx.fillRect(0, 0, WW, HH);
        flashRef.current = Math.max(0, flashRef.current - 0.06);
      }

      // Theme draw
      for (const p of particles) {
        switch (fx) {
          case "stars": {
            const a = 0.4 + Math.sin((Date.now()*0.001) + p.x) * 0.3;
            ctx.fillStyle = `rgba(220,230,255,${Math.max(0.1, a)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            break;
          }
          case "embers": {
            ctx.fillStyle = `rgba(255,${120+Math.random()*80|0},40,${0.5+Math.random()*0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.x += p.vx + Math.sin(p.y*0.02)*0.3; p.y += p.vy;
            if (p.y < -10) { p.y = HH+10; p.x = Math.random()*WW; }
            break;
          }
          case "leaves-green": {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot ?? 0);
            ctx.fillStyle = `hsl(${p.hue},60%,40%)`;
            ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); ctx.fill();
            ctx.restore();
            p.x += p.vx+Math.sin(p.y*0.02)*0.5; p.y += p.vy;
            if (p.rot!==undefined&&p.vr!==undefined) p.rot += p.vr;
            if (p.y > HH+20) { p.y = -20; p.x = Math.random()*WW; }
            break;
          }
          case "nebula": {
            ctx.fillStyle = `hsla(${p.hue},80%,60%,${0.25+p.life*0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.x += p.vx; p.y += p.vy;
            if (p.x<0) p.x=WW; if (p.x>WW) p.x=0; if (p.y<0) p.y=HH; if (p.y>HH) p.y=0;
            break;
          }
          case "dust": {
            ctx.fillStyle = `hsla(${p.hue},60%,55%,0.4)`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            p.x += p.vx; p.y += p.vy + Math.sin(p.x*0.01)*0.2;
            if (p.x < -10) { p.x = WW; p.y = Math.random()*HH; }
            break;
          }
          case "snow": {
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.x += p.vx + Math.sin(p.y*0.01)*0.4; p.y += p.vy;
            if (p.y > HH) { p.y = -5; p.x = Math.random()*WW; }
            break;
          }
          case "petals": {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot ?? 0);
            ctx.fillStyle = "rgba(255,183,210,0.85)";
            ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); ctx.fill();
            ctx.restore();
            p.x += p.vx + Math.sin(p.y*0.02)*0.6; p.y += p.vy;
            if (p.rot!==undefined&&p.vr!==undefined) p.rot += p.vr;
            if (p.y > HH+20) { p.y = -20; p.x = Math.random()*WW; }
            break;
          }
          case "rain-storm": {
            ctx.strokeStyle = "rgba(160,180,210,0.6)";
            ctx.lineWidth = p.size;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx,p.y+p.vy); ctx.stroke();
            p.x += p.vx; p.y += p.vy;
            if (p.y > HH) { p.y = -10; p.x = Math.random()*WW; }
            break;
          }
          case "glints": {
            const a = 0.3 + Math.sin((Date.now()*0.002) + p.x*0.1) * 0.5;
            ctx.fillStyle = `rgba(220,180,80,${Math.max(0.1,a)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            break;
          }
          case "sparkle": {
            ctx.fillStyle = `hsla(${p.hue},90%,70%,${0.5+p.life*0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.y += p.vy; p.life -= 0.004;
            if (p.life <= 0 || p.y < 0) { p.x = Math.random()*WW; p.y = HH+5; p.life = 1; }
            break;
          }
          case "drizzle": {
            ctx.strokeStyle = "rgba(180,200,220,0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx,p.y+p.vy); ctx.stroke();
            p.x += p.vx; p.y += p.vy;
            if (p.y > HH) { p.y = -10; p.x = Math.random()*WW; }
            break;
          }
          case "fog": {
            const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
            g.addColorStop(0,"rgba(180,180,195,0.15)");
            g.addColorStop(1,"rgba(180,180,195,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            p.x += p.vx; if (p.x > WW+p.size) p.x = -p.size;
            break;
          }
          case "glow": {
            ctx.fillStyle = `hsla(${p.hue},80%,65%,${0.4+p.life*0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.y += p.vy; p.life -= 0.003;
            if (p.life <= 0 || p.y < 0) { p.x = Math.random()*WW; p.y = HH+5; p.life = 1; }
            break;
          }
          case "shimmer": {
            const a = 0.2 + Math.sin((Date.now()*0.0015) + p.x*0.05) * 0.3;
            ctx.fillStyle = `hsla(${p.hue},50%,60%,${Math.max(0.1,a)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            break;
          }
        }
      }

      // Weather overlay
      for (const p of wParts) {
        switch (activeWeather) {
          case "rainy": case "morning-rain": case "night-rain":
          case "stormy": case "thunder": {
            ctx.strokeStyle = activeWeather === "morning-rain" ? "rgba(180,200,220,0.55)" : "rgba(150,180,220,0.6)";
            ctx.lineWidth = p.size;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx,p.y+p.vy); ctx.stroke();
            p.x += p.vx; p.y += p.vy;
            if (p.y > HH) { p.y = -10; p.x = Math.random()*WW; }
            break;
          }
          case "blizzard": {
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            p.x += p.vx + Math.sin(p.y*0.01)*0.5; p.y += p.vy;
            if (p.y > HH) { p.y = -5; p.x = Math.random()*WW; }
            if (p.x < -10) p.x = WW;
            break;
          }
          case "cloudy": {
            const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
            g.addColorStop(0,"rgba(220,220,235,0.18)");
            g.addColorStop(1,"rgba(220,220,235,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            p.x += p.vx; if (p.x > WW+p.size) p.x = -p.size;
            break;
          }
          case "sunny": {
            ctx.fillStyle = `rgba(255,220,140,${0.3+p.life*0.4})`;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            p.y += p.vy; p.life -= 0.003;
            if (p.y<0 || p.life<=0) { p.x = Math.random()*WW; p.y = HH+10; p.life = 1; }
            break;
          }
          case "sandstorm": {
            ctx.fillStyle = `rgba(210,170,90,${0.25+Math.random()*0.3})`;
            ctx.fillRect(p.x,p.y,p.size,p.size);
            p.x += p.vx; p.y += p.vy + Math.sin(p.x*0.01)*0.3;
            if (p.x < -10) { p.x = WW; p.y = Math.random()*HH; }
            break;
          }
          case "autumn": {
            ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot ?? 0);
            ctx.fillStyle = `hsl(${p.hue},70%,50%)`;
            ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); ctx.fill();
            ctx.restore();
            p.x += p.vx + Math.sin(p.y*0.02)*0.5; p.y += p.vy;
            if (p.rot!==undefined&&p.vr!==undefined) p.rot += p.vr;
            if (p.y > HH+20) { p.y = -20; p.x = Math.random()*WW; }
            break;
          }
          default: break;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", setSize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeTheme, activeWeather]);

  const bg = GRADIENTS[activeTheme];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        key={activeTheme}
        className="absolute inset-0 transition-opacity duration-[1500ms]"
        style={{ background: bg, animation: "float-up 1.5s ease-out" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
}

export const MANUAL_MOOD_LABELS: Record<ManualMood, { en: string; ar: string }> = {
  midnight: { en: "Midnight", ar: "منتصف الليل" },
  ember:    { en: "Ember",    ar: "جمر" },
  forest:   { en: "Forest",   ar: "غابة" },
  cosmic:   { en: "Cosmic",   ar: "كوني" },
  sand:     { en: "Sand",     ar: "رمل" },
  arctic:   { en: "Arctic",   ar: "قطبي" },
  sakura:   { en: "Sakura",   ar: "ساكورا" },
  storm:    { en: "Storm",    ar: "عاصفة" },
  gold:     { en: "Gold",     ar: "ذهبي" },
  void:     { en: "Void",     ar: "فراغ" },
};

export const AUTO_MOOD_LABELS: Record<AutoMood, { en: string; ar: string }> = {
  happy:    { en: "Happy",    ar: "سعيد" },
  sad:      { en: "Sad",      ar: "حزين" },
  anxious:  { en: "Anxious",  ar: "قلق" },
  angry:    { en: "Angry",    ar: "غاضب" },
  excited:  { en: "Excited",  ar: "متحمس" },
  tired:    { en: "Tired",    ar: "متعب" },
  lost:     { en: "Lost",     ar: "تائه" },
  grateful: { en: "Grateful", ar: "ممتن" },
  tense:    { en: "Tense",    ar: "متوتر" },
  ok:       { en: "OK",       ar: "بخير" },
};

export const WEATHER_LABELS: Record<NonNullable<WeatherMood>, { en: string; ar: string }> = {
  sunny: { en: "Sunny", ar: "مشمس" },
  stormy: { en: "Stormy", ar: "عاصف" },
  cloudy: { en: "Cloudy", ar: "غائم" },
  rainy: { en: "Rainy", ar: "ممطر" },
  sandstorm: { en: "Sandstorm", ar: "عاصفة رملية" },
  blizzard: { en: "Blizzard", ar: "عاصفة ثلجية" },
  thunder: { en: "Thunder & Lightning", ar: "رعد وبرق" },
  "night-rain": { en: "Night Rain", ar: "مطر ليلي" },
  "morning-rain": { en: "Morning Rain", ar: "مطر صباحي" },
  autumn: { en: "Autumn", ar: "خريف" },
};

// Back-compat re-export
export const MOOD_LABELS = MANUAL_MOOD_LABELS;