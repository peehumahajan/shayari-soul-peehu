import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Moon, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { UserAvatar } from "@/components/Avatar";
import { ShayariCard } from "@/components/ShayariCard";
import { SignInGate } from "@/routes/write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyPosts } from "@/lib/posts";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your profile — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Manage your pen name, avatar and the shayari you have shared with the mehfil.",
      },
      { property: "og:title", content: "Your profile — Ishq-e-Shayari" },
      { property: "og:description", content: "Your poet profile and posted shayari." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { user, profile, loading, isAdmin, refreshProfile } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const posts = useQuery({
    queryKey: ["my-posts", user?.id],
    queryFn: () => fetchMyPosts(user!.id),
    enabled: !!user,
  });

  if (!loading && !user) return <SignInGate />;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: (displayName ?? profile?.display_name ?? "").slice(0, 60),
        bio: (bio ?? profile?.bio ?? "").slice(0, 200),
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) toast.error("Could not save profile");
    else {
      toast.success("Profile updated");
      await refreshProfile();
    }
  };

  const uploadAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const path = `${user!.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      toast.error("Upload failed");
      return;
    }
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    await refreshProfile();
    toast.success("Avatar updated");
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div>
      <PageHeader
        title="You"
        subtitle={profile ? `@${profile.username}` : ""}
        action={
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {mode === "midnight" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        }
      />

      <div className="space-y-6 px-5 pb-10">
        <div className="surface-card flex items-center gap-4 p-5">
          <UserAvatar
            path={profile?.avatar_url}
            name={profile?.username}
            className="size-16 text-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg text-foreground">
              {profile?.display_name || profile?.username}
            </p>
            <label className="mt-1 inline-block cursor-pointer font-ui text-xs text-gold">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAvatar(f);
                }}
              />
            </label>
          </div>
          {profile?.is_premium ? <span className="text-gold">✦ Premium</span> : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              maxLength={60}
              value={displayName ?? profile?.display_name ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              maxLength={200}
              rows={3}
              value={bio ?? profile?.bio ?? ""}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Button onClick={save} disabled={busy} variant="secondary">
            Save profile
          </Button>
        </div>

        {isAdmin ? (
          <Button variant="outline" asChild className="w-full">
            <Link to="/admin">
              <ShieldCheck className="size-4" /> Moderation panel
            </Link>
          </Button>
        ) : null}

        <div className="flex gap-2">
          <Button variant="outline" asChild className="flex-1">
            <Link to="/about">About &amp; privacy</Link>
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
            Sign out
          </Button>
        </div>

        <div>
          <h2 className="mt-4 mb-3 font-display text-xl text-gold">Your shayari</h2>
          <div className="space-y-4">
            {posts.data?.length ? (
              posts.data.map((post) => (
                <div key={post.id}>
                  <ShayariCard post={post} onChanged={() => void posts.refetch()} />
                  <div className="mt-1 flex items-center justify-between px-2">
                    <span className="font-ui text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                      {post.status}
                    </span>
                    <button
                      className="font-ui text-xs text-destructive"
                      onClick={async () => {
                        await supabase.from("posts").delete().eq("id", post.id);
                        void posts.refetch();
                        toast.success("Deleted");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t posted yet. The mehfil awaits your first shayari.
              </p>
            )}
          </div>
        </div>

        <p className="pt-6 text-center font-ui text-[0.7rem] tracking-widest text-muted-foreground uppercase">
          Made by Shayar Peehu
        </p>
      </div>
    </div>
  );
}