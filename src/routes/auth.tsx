import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Sign in with email or Google to post shayari, save couplets and join the mehfil.",
      },
      { property: "og:title", content: "Sign in — Ishq-e-Shayari" },
      { property: "og:description", content: "Join the mehfil of original shayari." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim().toLowerCase() },
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-7 py-12">
      <div className="animate-rise">
        <h1 className="text-gold-gradient font-display text-4xl">Ishq-e-Shayari</h1>
        <p className="script-hindi mt-4 text-lg text-muted-foreground">
          महफ़िल में आपका इंतज़ार है
        </p>
      </div>

      {sent ? (
        <div className="surface-card mt-10 p-6 text-center">
          <p className="font-display text-xl text-gold">Check your email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {email}. Confirm it to enter the mehfil.
          </p>
        </div>
      ) : (
        <>
          <Button variant="secondary" className="mt-10" onClick={google} disabled={busy}>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or {mode === "in" ? "sign in" : "sign up"}{" "}
            with email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "up" ? (
              <div className="space-y-2">
                <Label htmlFor="username">Pen name (username)</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_]+"
                  placeholder="shayar_peehu"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "in" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            className="mt-6 font-ui text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "New here? Create an account" : "Already a member? Sign in"}
          </button>
        </>
      )}

      <p className="mt-10 text-center font-ui text-[0.7rem] tracking-widest text-muted-foreground uppercase">
        Made by Shayar Peehu
      </p>
    </div>
  );
}