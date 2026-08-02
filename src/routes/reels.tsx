import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Flag, Heart, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/Avatar";
import { SignInGate } from "@/routes/write";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabel, scriptClass } from "@/lib/ishq";
import { signedUrl } from "@/lib/media";
import {
  fetchFeed,
  fetchMyBookmarks,
  fetchMyLikes,
  reportPost,
  toggleBookmark,
  toggleLike,
  type PostRow,
} from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Shayari Reels — Ishq-e-Shayari" },
      {
        name: "description",
        content:
          "A vertical feed of shayari recitations. Poetry-only reels, moderated for a clean mehfil.",
      },
      { property: "og:title", content: "Shayari Reels — Ishq-e-Shayari" },
      { property: "og:description", content: "Watch poets recite their own shayari." },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  const { user } = useAuth();
  const [muted, setMuted] = useState(true);

  const feed = useQuery({
    queryKey: ["reels"],
    queryFn: () => fetchFeed({ kind: "reel", sort: "trending", limit: 20 }),
  });
  const likes = useQuery({
    queryKey: ["likes", user?.id],
    queryFn: () => fetchMyLikes(user!.id),
    enabled: !!user,
  });
  const saves = useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: () => fetchMyBookmarks(user!.id),
    enabled: !!user,
  });

  const refresh = () => {
    void feed.refetch();
    void likes.refetch();
    void saves.refetch();
  };

  if (feed.isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">…</div>;
  }

  if (!feed.data?.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h1 className="text-gold-gradient font-display text-3xl">No reels yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Record yourself reciting a shayari and be the first reel of this mehfil.
        </p>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar h-[calc(100vh-5rem)] snap-y snap-mandatory overflow-y-auto">
      {feed.data.map((post) => (
        <Reel
          key={post.id}
          post={post}
          muted={muted}
          toggleMute={() => setMuted((m) => !m)}
          liked={!!likes.data?.has(post.id)}
          saved={!!saves.data?.has(post.id)}
          onChanged={refresh}
          canAct={!!user}
          userId={user?.id}
        />
      ))}
      {!user ? (
        <div className="border-t border-border">
          <SignInGate />
        </div>
      ) : null}
    </div>
  );
}

function Reel({
  post,
  muted,
  toggleMute,
  liked,
  saved,
  onChanged,
  canAct,
  userId,
}: {
  post: PostRow;
  muted: boolean;
  toggleMute: () => void;
  liked: boolean;
  saved: boolean;
  onChanged: () => void;
  canAct: boolean;
  userId?: string | undefined;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    void signedUrl("reels", post.video_url).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [post.video_url]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.intersectionRatio > 0.6) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [url]);

  const guard = () => {
    if (!canAct) {
      toast("Sign in to react");
      return false;
    }
    return true;
  };

  return (
    <section className="relative h-[calc(100vh-5rem)] w-full snap-start snap-always overflow-hidden bg-black">
      {url ? (
        <video
          ref={ref}
          src={url}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          className="size-full object-contain"
          onClick={() => {
            const el = ref.current;
            if (!el) return;
            if (el.paused) void el.play().catch(() => {});
            else el.pause();
          }}
        />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground">loading…</div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "var(--gradient-veil-up)" }}
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <UserAvatar
              path={post.profiles?.avatar_url}
              name={post.profiles?.username}
              className="size-8"
            />
            <span className="font-ui text-sm text-foreground">@{post.profiles?.username}</span>
            <span className="rounded-full border border-border px-2 py-0.5 font-ui text-[0.65rem] text-gold">
              {categoryLabel(post.category)}
            </span>
          </div>
          <p
            className={cn(
              "mt-3 line-clamp-4 whitespace-pre-wrap text-base text-foreground/95",
              scriptClass(post.script),
            )}
          >
            {post.body}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mute"
            onClick={toggleMute}
            className="rounded-full bg-black/40"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
          <ReelAction
            label="Like"
            count={post.like_count}
            onClick={async () => {
              if (!guard()) return;
              await toggleLike(post.id, userId!, liked);
              onChanged();
            }}
          >
            <Heart className={cn("size-6", liked && "fill-rose text-rose")} />
          </ReelAction>
          <ReelAction
            label="Save"
            onClick={async () => {
              if (!guard()) return;
              await toggleBookmark(post.id, userId!, saved);
              onChanged();
            }}
          >
            <Bookmark className={cn("size-6", saved && "fill-gold text-gold")} />
          </ReelAction>
          <ReelAction
            label="Report"
            onClick={async () => {
              if (!guard()) return;
              try {
                await reportPost(post.id, userId!, "Reported from reels");
                toast.success("Reported for review");
              } catch {
                toast.error("Already reported");
              }
            }}
          >
            <Flag className="size-6" />
          </ReelAction>
        </div>
      </div>
    </section>
  );
}

function ReelAction({
  children,
  label,
  count,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      onClick={() => void onClick()}
      aria-label={label}
      className="flex flex-col items-center gap-0.5 rounded-full p-2 text-foreground transition-transform active:scale-90"
    >
      {children}
      {typeof count === "number" ? <span className="font-ui text-xs">{count}</span> : null}
    </button>
  );
}