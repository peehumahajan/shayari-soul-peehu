import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { ShayariCard } from "@/components/ShayariCard";
import { SignInGate } from "@/routes/write";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyLikes, fetchSaved } from "@/lib/posts";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Your diary — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Every shayari you saved, kept together in your private poetry diary.",
      },
      { property: "og:title", content: "Your diary — Ishq-e-Shayari" },
      { property: "og:description", content: "Your private collection of saved couplets." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  const saved = useQuery({
    queryKey: ["saved", user?.id],
    queryFn: () => fetchSaved(user!.id),
    enabled: !!user,
  });
  const likes = useQuery({
    queryKey: ["likes", user?.id],
    queryFn: () => fetchMyLikes(user!.id),
    enabled: !!user,
  });

  if (!loading && !user) return <SignInGate />;

  return (
    <div>
      <PageHeader title="Diary" subtitle="आपके सहेजे हुए शेर" />
      <div className="space-y-4 px-4 pb-8">
        {saved.isLoading ? (
          <Skeleton className="h-44 w-full rounded-2xl" />
        ) : saved.data?.length ? (
          saved.data.map((post) => (
            <ShayariCard
              key={post.id}
              post={post}
              saved
              liked={likes.data?.has(post.id)}
              onChanged={() => {
                void saved.refetch();
                void likes.refetch();
              }}
            />
          ))
        ) : (
          <p className="px-2 py-16 text-center text-sm text-muted-foreground">
            Nothing saved yet. Tap the bookmark on any shayari to keep it here.
          </p>
        )}
      </div>
    </div>
  );
}