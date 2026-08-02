import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flame, Settings, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ShayariCard } from "@/components/ShayariCard";
import { Onboarding } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES } from "@/lib/ishq";
import { fetchFeed, fetchMyBookmarks, fetchMyLikes } from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ishq-e-Shayari — Trending & Fresh Shayari" },
      {
        name: "description",
        content:
          "The mehfil: trending and fresh original shayari in Hindi, Urdu, Roman and Punjabi. Like, save and share the words that feel like yours.",
      },
      { property: "og:title", content: "Ishq-e-Shayari — Trending & Fresh Shayari" },
      {
        property: "og:description",
        content: "Discover trending original shayari and share the couplets that feel like yours.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const [sort, setSort] = useState<"trending" | "fresh">("trending");
  const [category, setCategory] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem("ishq-onboarded")) setShowOnboarding(true);
  }, []);

  const feed = useQuery({
    queryKey: ["feed", sort, category],
    queryFn: () => fetchFeed({ sort, kind: "text", category }),
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

  if (showOnboarding) {
    return (
      <Onboarding
        onDone={() => {
          window.localStorage.setItem("ishq-onboarded", "1");
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Ishq-e-Shayari"
        subtitle="जहाँ हर लफ़्ज़ दिल से निकलता है"
        action={
          <Button variant="ghost" size="icon" asChild aria-label="Settings">
            <Link to="/about">
              <Settings className="size-5" />
            </Link>
          </Button>
        }
      />

      <div className="sticky top-0 z-30 bg-background/90 px-5 pt-1 pb-3 backdrop-blur">
        <div className="flex gap-2">
          <TabButton active={sort === "trending"} onClick={() => setSort("trending")}>
            <Flame className="size-4" /> Trending
          </TabButton>
          <TabButton active={sort === "fresh"} onClick={() => setSort("fresh")}>
            <Sparkles className="size-4" /> New &amp; Fresh
          </TabButton>
        </div>
        <div className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <Pill active={!category} onClick={() => setCategory(null)}>
            All
          </Pill>
          {CATEGORIES.map((c) => (
            <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8">
        {feed.isLoading ? (
          <>
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </>
        ) : feed.data?.length ? (
          feed.data.map((post, i) => (
            <ShayariCard
              key={post.id}
              post={post}
              liked={likes.data?.has(post.id)}
              saved={saves.data?.has(post.id)}
              onChanged={refresh}
              {...(sort === "trending" && i < 3 ? { rank: i + 1 } : {})}
            />
          ))
        ) : (
          <div className="surface-card p-8 text-center">
            <p className="font-display text-xl text-gold">The mehfil is quiet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first voice here — write a shayari and start the evening.
            </p>
            <Button variant="default" className="mt-5" asChild>
              <Link to="/write">Likho apni shayari</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
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
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-full border py-2 font-ui text-sm transition-all",
        active
          ? "border-gold/60 bg-secondary text-gold shadow-[var(--shadow-glow)]"
          : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Pill({
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
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 font-ui text-xs transition-colors",
        active
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
