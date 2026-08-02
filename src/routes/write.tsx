import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, SCRIPTS, detectSpam, scriptClass } from "@/lib/ishq";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "Write shayari — Ishq-e-Shayari" },
      {
        name: "description",
        content:
          "Compose original shayari in Hindi, Urdu, Roman or Punjabi, pick a mood and share it with the mehfil.",
      },
      { property: "og:title", content: "Write shayari — Ishq-e-Shayari" },
      { property: "og:description", content: "Compose and share your own couplets." },
    ],
  }),
  component: WritePage,
});

function WritePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [script, setScript] = useState<string>("hindi");
  const [category, setCategory] = useState<string>("love");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  if (!loading && !user) return <SignInGate />;

  const submit = async () => {
    const text = body.trim();
    if (text.length < 5) {
      toast.error("Write a little more");
      return;
    }
    if (text.length > 1000) {
      toast.error("Keep it under 1000 characters");
      return;
    }
    const spam = detectSpam(text);
    if (spam.length) {
      toast.error("Please remove links or promotional words", { description: spam.join(", ") });
      return;
    }
    setBusy(true);
    try {
      let videoPath: string | null = null;
      if (file) {
        if (file.size > 40 * 1024 * 1024) throw new Error("Video must be under 40MB");
        const path = `${user!.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
        const { error } = await supabase.storage.from("reels").upload(path, file, {
          contentType: file.type,
        });
        if (error) throw error;
        videoPath = path;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user!.id,
        kind: videoPath ? "reel" : "text",
        body: text,
        script,
        category,
        video_url: videoPath,
      });
      if (error) throw error;
      toast.success("Posted to the mehfil");
      void navigate({ to: videoPath ? "/reels" : "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Likho" subtitle="जो दिल में है, वही लिखो" />
      <div className="space-y-6 px-5 pb-10">
        <div className="surface-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={7}
            placeholder="अपनी शायरी लिखिए…"
            className={cn("resize-none border-0 bg-transparent text-lg", scriptClass(script))}
          />
          <p className="mt-1 text-right font-ui text-xs text-muted-foreground">
            {body.length}/1000
          </p>
        </div>

        <div className="space-y-2">
          <Label>Script</Label>
          <div className="flex flex-wrap gap-2">
            {SCRIPTS.map((s) => (
              <Chip key={s.id} active={script === s.id} onClick={() => setScript(s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reel">Optional: video reel (recitation)</Label>
          <input
            id="reel"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border bg-card p-3 font-ui text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Poetry recitations only. Vulgar or unrelated videos are removed and accounts reported.
          </p>
        </div>

        <Button className="w-full" onClick={submit} disabled={busy}>
          {busy ? "Posting…" : "Share with the mehfil"}
        </Button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 font-ui text-xs transition-colors",
        active ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function SignInGate() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <h1 className="text-gold-gradient font-display text-3xl">Join the mehfil</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sign in to write shayari, save couplets and follow poets you love.
      </p>
      <Button className="mt-6" asChild>
        <Link to="/auth">Sign in or create account</Link>
      </Button>
    </div>
  );
}