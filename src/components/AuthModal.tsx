import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lang } = useApp();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success(t(lang, "checkEmail"));
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast.success(t(lang, "checkEmail"));
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error(r.error.message ?? "Google sign-in failed"); setBusy(false); return; }
    if (r.redirected) return;
    onOpenChange(false);
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[var(--glass-border)] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-cinema)] grid place-items-center glow-cinema">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            {mode === "signup" ? t(lang, "createAccount") : mode === "forgot" ? t(lang, "forgotPassword") : t(lang, "welcome")}
          </DialogTitle>
        </DialogHeader>

        {mode !== "forgot" && (
          <Button type="button" variant="outline" className="w-full glass" onClick={google} disabled={busy}>
            <svg className="w-4 h-4 me-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-1 2.3-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.3z"/><path fill="currentColor" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H2.9v2.6C4.6 19.6 8 22 12 22z"/><path fill="currentColor" d="M6.3 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.4-2.6z"/><path fill="currentColor" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.8 14.7 2 12 2 8 2 4.6 4.4 2.9 7.6l3.4 2.6C7.1 7.6 9.4 5.8 12 5.8z"/></svg>
            {t(lang, "continueGoogle")}
          </Button>
        )}

        {mode !== "forgot" && <div className="flex items-center gap-3 my-1 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border"/>{t(lang, "or")}<div className="flex-1 h-px bg-border"/></div>}

        <form onSubmit={handle} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>{t(lang, "displayName")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="glass" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t(lang, "email")}</Label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="glass" />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label>{t(lang, "password")}</Label>
              <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="glass" />
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full bg-[var(--gradient-cinema)] text-primary-foreground hover:opacity-90">
            {mode === "signup" ? t(lang, "signUp") : mode === "forgot" ? t(lang, "sendReset") : t(lang, "signIn")}
          </Button>
        </form>

        <div className="text-xs text-center space-y-1 text-muted-foreground pt-2">
          {mode === "signin" && (<>
            <button className="hover:text-primary block mx-auto" onClick={() => setMode("forgot")}>{t(lang, "forgotPassword")}</button>
            <button className="hover:text-primary" onClick={() => setMode("signup")}>{t(lang, "signUp")} →</button>
          </>)}
          {mode === "signup" && (<button className="hover:text-primary" onClick={() => setMode("signin")}>← {t(lang, "signIn")}</button>)}
          {mode === "forgot" && (<button className="hover:text-primary" onClick={() => setMode("signin")}>← {t(lang, "backToSignIn")}</button>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}