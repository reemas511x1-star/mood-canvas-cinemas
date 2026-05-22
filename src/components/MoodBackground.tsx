import { useEffect, useRef } from "react";
import { useApp, type MoodPreset, type WeatherMood } from "@/contexts/AppContext";

const PRESET_GRADIENTS: Record<MoodPreset, string> = {
  "masculine-dark": "radial-gradient(1200px 800px at 20% 0%, #1a2538 0%, #0a0f1a 60%, #050811 100%)",
  light: "radial-gradient(1200px 800px at 50% 0%, #3a3530 0%, #1d1a17 60%, #0c0a08 100%)",
  "feminine-vibrant": "radial-gradient(1200px 800px at 80% 0%, #4a1a3d 0%, #1f0a2a 60%, #0b0612 100%)",
  "feminine-soft": "radial-gradient(1200px 800px at 30% 0%, #3d2a3a 0%, #1c1422 60%, #0d0a12 100%)",
  neutral: "radial-gradient(1200px 800px at 50% 0%, #25262a 0%, #131418 60%, #08080b 100%)",
  dark: "radial-gradient(1200px 800px at 50% 0%, #14182a 0%, #080a15 60%, #03040a 100%)",
};

type Particle = { x: number; y: number; vx: number; vy: number; size: number; life: number; rot?: number; vr?: number; hue?: number };

export function MoodBackground() {
  const { mood, weather } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const flashRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth * devicePixelRatio);
    let h = (canvas.height = window.innerHeight * devicePixelRatio);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    window.addEventListener("resize", onResize);

    const particles: Particle[] = [];
    const seed = (n: number, fn: () => Particle) => {
      for (let i = 0; i < n; i++) particles.push(fn());
    };

    const reset = () => {
      particles.length = 0;
      flashRef.current = 0;
      const W0 = W(); const H0 = H();
      switch (weather) {
        case "rainy":
        case "morning-rain":
        case "night-rain":
          seed(220, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: -2, vy: 12 + Math.random() * 6, size: 1 + Math.random(), life: 1 }));
          break;
        case "stormy":
        case "thunder":
          seed(300, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: -3, vy: 14 + Math.random() * 6, size: 1 + Math.random(), life: 1 }));
          break;
        case "blizzard":
          seed(260, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: -2 + Math.random() * 4, vy: 1 + Math.random() * 3, size: 1.5 + Math.random() * 3, life: 1 }));
          break;
        case "cloudy":
          seed(7, () => ({ x: Math.random() * W0, y: Math.random() * H0 * 0.6, vx: 0.2 + Math.random() * 0.3, vy: 0, size: 200 + Math.random() * 180, life: 1 }));
          break;
        case "sunny":
          seed(40, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: 0, vy: -0.3 - Math.random() * 0.4, size: 2 + Math.random() * 2, life: Math.random() }));
          break;
        case "sandstorm":
          seed(400, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: -6 - Math.random() * 4, vy: -0.5 + Math.random(), size: 1 + Math.random() * 2, life: 1, hue: 30 + Math.random() * 20 }));
          break;
        case "autumn":
          seed(60, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: -0.5 + Math.random(), vy: 1 + Math.random() * 1.5, size: 6 + Math.random() * 8, life: 1, rot: Math.random() * 6, vr: (-0.05 + Math.random() * 0.1), hue: 20 + Math.random() * 30 }));
          break;
        default:
          seed(50, () => ({ x: Math.random() * W0, y: Math.random() * H0, vx: 0, vy: -0.1 - Math.random() * 0.2, size: 1 + Math.random() * 1.5, life: 1 }));
      }
    };
    reset();

    const draw = () => {
      const W0 = W(); const H0 = H();
      ctx.clearRect(0, 0, W0, H0);

      // Lightning flash
      if ((weather === "thunder" || weather === "stormy") && Math.random() < 0.004) flashRef.current = 1;
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(220,230,255,${flashRef.current * 0.35})`;
        ctx.fillRect(0, 0, W0, H0);
        flashRef.current = Math.max(0, flashRef.current - 0.06);
      }

      for (const p of particles) {
        switch (weather) {
          case "rainy":
          case "morning-rain":
          case "night-rain":
          case "stormy":
          case "thunder": {
            ctx.strokeStyle = weather === "morning-rain" ? "rgba(180,200,220,0.55)" : "rgba(150,180,220,0.6)";
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx, p.y + p.vy);
            ctx.stroke();
            p.x += p.vx; p.y += p.vy;
            if (p.y > H0) { p.y = -10; p.x = Math.random() * W0; }
            break;
          }
          case "blizzard": {
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            p.x += p.vx + Math.sin(p.y * 0.01) * 0.5; p.y += p.vy;
            if (p.y > H0) { p.y = -5; p.x = Math.random() * W0; }
            if (p.x < -10) p.x = W0;
            break;
          }
          case "cloudy": {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            g.addColorStop(0, "rgba(220,220,235,0.18)");
            g.addColorStop(1, "rgba(220,220,235,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            p.x += p.vx; if (p.x > W0 + p.size) p.x = -p.size;
            break;
          }
          case "sunny": {
            ctx.fillStyle = `rgba(255,220,140,${0.3 + p.life * 0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            p.y += p.vy; p.life -= 0.003;
            if (p.y < 0 || p.life <= 0) { p.x = Math.random() * W0; p.y = H0 + 10; p.life = 1; }
            break;
          }
          case "sandstorm": {
            ctx.fillStyle = `rgba(210,170,90,${0.25 + Math.random() * 0.3})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            p.x += p.vx; p.y += p.vy + Math.sin(p.x * 0.01) * 0.3;
            if (p.x < -10) { p.x = W0; p.y = Math.random() * H0; }
            break;
          }
          case "autumn": {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot ?? 0);
            ctx.fillStyle = `hsl(${p.hue}, 70%, 50%)`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            p.x += p.vx + Math.sin(p.y * 0.02) * 0.5;
            p.y += p.vy;
            if (p.rot !== undefined && p.vr !== undefined) p.rot += p.vr;
            if (p.y > H0 + 20) { p.y = -20; p.x = Math.random() * W0; }
            break;
          }
          default: {
            ctx.fillStyle = "rgba(255,200,120,0.4)";
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            p.y += p.vy;
            if (p.y < -5) { p.y = H0 + 5; p.x = Math.random() * W0; }
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [weather]);

  const bg = PRESET_GRADIENTS[mood];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        key={mood}
        className="absolute inset-0 transition-opacity duration-[1500ms]"
        style={{ background: bg, animation: "float-up 1.5s ease-out" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)",
      }} />
    </div>
  );
}

export const MOOD_LABELS: Record<MoodPreset, { en: string; ar: string }> = {
  "masculine-dark": { en: "Masculine Dark", ar: "غامق ذكوري" },
  light: { en: "Light", ar: "فاتح" },
  "feminine-vibrant": { en: "Feminine Vibrant", ar: "أنثوي حيوي" },
  "feminine-soft": { en: "Feminine Soft", ar: "أنثوي ناعم" },
  neutral: { en: "Neutral", ar: "حيادي" },
  dark: { en: "Dark", ar: "داكن" },
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