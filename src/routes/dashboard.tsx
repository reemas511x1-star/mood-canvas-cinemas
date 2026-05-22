import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Navbar } from "@/components/Navbar";
import { WatchGrid } from "@/components/WatchGrid";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, lang } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight mb-8">
          <span className="text-gradient-cinema">{t(lang, "dashboard")}</span>
        </h1>
        <WatchGrid />
      </main>
    </div>
  );
}