import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and fires a PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY" || e === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error(lang === "ar" ? "8 أحرف على الأقل" : "Min 8 characters");
    if (pw !== pw2) return toast.error(lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم تحديث كلمة المرور" : "Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="glass-strong rounded-3xl p-8 w-full max-w-md space-y-5">
        <h1 className="text-2xl font-bold text-gradient-cinema">
          {lang === "ar" ? "كلمة مرور جديدة" : "Set a new password"}
        </h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "جارٍ التحقق من الرابط…" : "Verifying recovery link…"}
          </p>
        ) : (
          <>
            <Input type="password" placeholder={t(lang, "password")} value={pw} onChange={e => setPw(e.target.value)} className="h-12 glass" />
            <Input type="password" placeholder={lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"} value={pw2} onChange={e => setPw2(e.target.value)} className="h-12 glass" />
            <Button type="submit" disabled={busy} className="w-full h-12 bg-[var(--gradient-cinema)] text-primary-foreground glow-cinema">
              {t(lang, "save")}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}