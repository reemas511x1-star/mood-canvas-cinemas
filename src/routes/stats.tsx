import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/stats")({ component: StatsPage });

const COLORS = ["#ff3366", "#9b5bff", "#3bd1ff", "#ffd166", "#06d6a0", "#f78c6b"];

function StatsPage() {
  const { user, loading, lang } = useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("watch_items").select("*").then(({ data }) => setItems(data ?? []));
  }, [user]);

  const { byStatus, byType, byGenre, byYear, ratingHist } = useMemo(() => {
    const byStatus = ["watched", "watching", "plan"].map((s) => ({
      name: s, value: items.filter((i) => i.status === s).length,
    }));
    const byType = ["movie", "tv"].map((t) => ({
      name: t === "movie" ? (lang === "ar" ? "أفلام" : "Movies") : (lang === "ar" ? "مسلسلات" : "Series"),
      value: items.filter((i) => i.media_type === t).length,
    }));
    const genreMap: Record<string, number> = {};
    items.forEach((i) => (i.genres ?? []).forEach((g: string) => (genreMap[g] = (genreMap[g] ?? 0) + 1)));
    const byGenre = Object.entries(genreMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
    const yearMap: Record<number, number> = {};
    items.forEach((i) => i.release_year && (yearMap[i.release_year] = (yearMap[i.release_year] ?? 0) + 1));
    const byYear = Object.entries(yearMap).map(([name, value]) => ({ name: Number(name), value }))
      .sort((a, b) => a.name - b.name).slice(-12);
    const ratingHist = [1, 2, 3, 4, 5].map((r) => ({
      name: `★${r}`, value: items.filter((i) => i.user_rating === r).length,
    }));
    return { byStatus, byType, byGenre, byYear, ratingHist };
  }, [items, lang]);

  if (!user) return null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass rounded-3xl p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl space-y-6">
        <h1 className="text-4xl font-bold"><span className="text-gradient-cinema">{lang === "ar" ? "إحصاءاتك" : "Your Stats"}</span></h1>
        {items.length === 0 ? (
          <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
            {lang === "ar" ? "أضف عناوين لرؤية الإحصاءات." : "Add titles to see your stats."}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            <Section title={lang === "ar" ? "الحالة" : "By status"}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title={lang === "ar" ? "النوع" : "Movies vs Series"}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title={lang === "ar" ? "أعلى التصنيفات" : "Top genres"}>
              <ResponsiveContainer>
                <BarChart data={byGenre}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#9b5bff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title={lang === "ar" ? "تقييماتك" : "Your ratings"}>
              <ResponsiveContainer>
                <BarChart data={ratingHist}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#ff3366" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <div className="md:col-span-2">
              <Section title={lang === "ar" ? "سنوات الإصدار" : "Release years"}>
                <ResponsiveContainer>
                  <BarChart data={byYear}>
                    <XAxis dataKey="name" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    <Bar dataKey="value" fill="#3bd1ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}