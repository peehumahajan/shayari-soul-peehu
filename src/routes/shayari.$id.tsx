import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/Avatar";
import { ShayariCard } from "@/components/ShayariCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { detectSpam, timeAgo } from "@/lib/ishq";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchComments,
  fetchMyBookmarks,
  fetchMyLikes,
  fetchPost,
} from "@/lib/posts";

export const Route = createFileRoute("/shayari/$id")({
  head: () => ({
    meta: [
      { title: "Shayari — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Read this shayari, its comments and share it with someone who needs these words.",
      },
      { property: "og:title", content: "Shayari — Ishq-e-Shayari" },
      { property: "og:description", content: "A couplet from the Ishq-e-Shayari mehfil." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const post = useQuery({ queryKey: ["post", id], queryFn: () => fetchPost(id) });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => fetchComments(id) });
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

  const addComment = async () => {
    const body = text.trim();
    if (body.length < 2) return;
    if (detectSpam(body).length) {
      toast.error("Please remove links or promotional words");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: id, user_id: user!.id, body: body.slice(0, 500) });
    setBusy(false);
    if (error) toast.error("Could not comment");
    else {
      setText("");
      void comments.refetch();
      void post.refetch();
    }
  };

  return (
    <div className="px-4 pt-6 pb-10">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="size-4" /> Mehfil
        </Link>
      </Button>

      {post.data ? (
        <ShayariCard
          post={post.data}
          liked={likes.data?.has(post.data.id)}
          saved={saves.data?.has(post.data.id)}
          onChanged={() => {
            void post.refetch();
            void likes.refetch();
            void saves.refetch();
          }}
        />
      ) : post.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <p className="text-sm text-muted-foreground">This shayari is no longer available.</p>
      )}

      <h2 className="mt-8 mb-3 font-display text-xl text-gold">Comments</h2>

      {user ? (
        <div className="mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Apna khayal likhein…"
          />
          <Button size="sm" className="mt-2" onClick={addComment} disabled={busy}>
            Comment
          </Button>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <Link to="/auth" className="text-gold underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="space-y-4">
        {comments.data?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <UserAvatar
              path={c.profiles?.avatar_url}
              name={c.profiles?.username}
              className="size-8"
            />
            <div className="min-w-0 flex-1">
              <p className="font-ui text-xs text-muted-foreground">
                @{c.profiles?.username} · {timeAgo(c.created_at)}
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-foreground/90">{c.body}</p>
            </div>
            {c.user_id === user?.id ? (
              <button
                className="font-ui text-xs text-destructive"
                onClick={async () => {
                  await supabase.from("comments").delete().eq("id", c.id);
                  void comments.refetch();
                  void post.refetch();
                }}
              >
                Delete
              </button>
            ) : null}
          </li>
        ))}
        {comments.data?.length === 0 ? (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        ) : null}
      </ul>
    </div>
  );
}