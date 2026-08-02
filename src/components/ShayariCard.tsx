import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Flag, Share2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabel, scriptClass, timeAgo } from "@/lib/ishq";
import { reportPost, toggleBookmark, toggleLike, type PostRow } from "@/lib/posts";
import { cn } from "@/lib/utils";

export function ShayariCard({
  post,
  liked,
  saved,
  onChanged,
  rank,
}: {
  post: PostRow;
  liked?: boolean | undefined;
  saved?: boolean | undefined;
  onChanged?: (() => void) | undefined;
  rank?: number | undefined;
}) {
  const { user, profile } = useAuth();

  const needAuth = () => {
    toast("Sign in to join the mehfil", { description: "Create a free account to like and save." });
  };

  const like = async () => {
    if (!user) return needAuth();
    try {
      await toggleLike(post.id, user.id, !!liked);
      onChanged?.();
    } catch {
      toast.error("Could not update like");
    }
  };

  const save = async () => {
    if (!user) return needAuth();
    try {
      await toggleBookmark(post.id, user.id, !!saved);
      onChanged?.();
      toast.success(saved ? "Removed from your diary" : "Saved to your diary");
    } catch {
      toast.error("Could not update bookmark");
    }
  };

  const report = async () => {
    if (!user) return needAuth();
    try {
      await reportPost(post.id, user.id, "Reported from feed");
      toast.success("Reported. Our moderators will review it.");
    } catch {
      toast.error("Already reported or not allowed");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/shayari/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ text: post.body, url });
      else {
        await navigator.clipboard.writeText(`${post.body}\n\n${url}`);
        toast.success("Copied to clipboard");
      }
    } catch {
      /* dismissed */
    }
  };

  const isMine = profile?.id === post.author_id;

  return (
    <article className="surface-card animate-rise relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60"
        style={{ background: "var(--gradient-veil)" }}
      />
      <div className="relative flex items-center gap-3">
        <Link to="/u/$username" params={{ username: post.profiles?.username ?? "" }}>
          <UserAvatar path={post.profiles?.avatar_url} name={post.profiles?.username} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/u/$username"
            params={{ username: post.profiles?.username ?? "" }}
            className="block truncate font-ui text-sm text-foreground"
          >
            {post.profiles?.display_name || post.profiles?.username}
            {post.profiles?.is_premium ? <span className="ml-1 text-gold">✦</span> : null}
          </Link>
          <p className="text-xs text-muted-foreground">
            @{post.profiles?.username} · {timeAgo(post.created_at)}
          </p>
        </div>
        {rank ? (
          <span className="rounded-full border border-border px-2 py-0.5 font-display text-xs text-gold">
            #{rank}
          </span>
        ) : null}
      </div>

      <Link to="/shayari/$id" params={{ id: post.id }} className="relative mt-5 block">
        <p
          className={cn(
            "whitespace-pre-wrap text-[1.35rem] text-foreground/95",
            scriptClass(post.script),
          )}
        >
          {post.body}
        </p>
      </Link>

      <div className="relative mt-5 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 font-ui text-[0.7rem] tracking-wide text-secondary-foreground uppercase">
          {categoryLabel(post.category)}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={like} aria-label="Like">
            <Heart className={cn("size-4", liked && "fill-rose text-rose")} />
            <span className="font-ui text-xs">{post.like_count}</span>
          </Button>
          <Button variant="ghost" size="sm" asChild aria-label="Comments">
            <Link to="/shayari/$id" params={{ id: post.id }}>
              <MessageCircle className="size-4" />
              <span className="font-ui text-xs">{post.comment_count}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={save} aria-label="Save">
            <Bookmark className={cn("size-4", saved && "fill-gold text-gold")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={share} aria-label="Share">
            <Share2 className="size-4" />
          </Button>
          {!isMine ? (
            <Button variant="ghost" size="sm" onClick={report} aria-label="Report">
              <Flag className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}