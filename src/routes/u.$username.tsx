import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { UserAvatar } from "@/components/Avatar";
import { ShayariCard } from "@/components/ShayariCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchFeed, fetchMyBookmarks, fetchMyLikes } from "@/lib/posts";

export const Route = createFileRoute("/u/$username")({
  head: () => ({
    meta: [
      { title: "Poet profile — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Read every shayari shared by this poet in the Ishq-e-Shayari mehfil.",
      },
      { property: "og:title", content: "Poet profile — Ishq-e-Shayari" },
      { property: "og:description", content: "A poet's collected shayari." },
    ],
  }),
  component: PoetPage,
});

function PoetPage() {
  const { username } = Route.useParams();
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, is_premium")
        .eq("username", username)
        .maybeSingle();
      return data;
    },
  });

  const posts = useQuery({
    queryKey: ["poet-posts", profile.data?.id],
    queryFn: () => fetchFeed({ authorId: profile.data!.id, sort: "fresh" }),
    enabled: !!profile.data?.id,
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

  if (!profile.isLoading && !profile.data) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Poet not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title={profile.data?.display_name || username}
        subtitle={`@${username}`}
        action={
          <UserAvatar
            path={profile.data?.avatar_url}
            name={username}
            className="size-14 text-base"
          />
        }
      />
      {profile.data?.bio ? (
        <p className="px-5 pb-4 text-sm text-muted-foreground">{profile.data.bio}</p>
      ) : null}
      <div className="space-y-4 px-4 pb-8">
        {posts.data?.map((post) => (
          <ShayariCard
            key={post.id}
            post={post}
            liked={likes.data?.has(post.id)}
            saved={saves.data?.has(post.id)}
            onChanged={() => {
              void posts.refetch();
              void likes.refetch();
              void saves.refetch();
            }}
          />
        ))}
        {posts.data?.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No shayari yet.</p>
        ) : null}
      </div>
    </div>
  );
}