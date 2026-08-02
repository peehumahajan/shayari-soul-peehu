import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { scriptClass, timeAgo } from "@/lib/ishq";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation — Ishq-e-Shayari" },
      {
        name: "description",
        content: "Moderator tools for reviewing reported and pending shayari and reels.",
      },
      { property: "og:title", content: "Moderation — Ishq-e-Shayari" },
      { property: "og:description", content: "Review reported content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Queue = {
  id: string;
  body: string;
  script: string;
  kind: string;
  status: string;
  created_at: string;
  trending_score: number;
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();

  const queue = useQuery({
    queryKey: ["mod-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, body, script, kind, status, created_at, trending_score")
        .in("status", ["pending", "hidden"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Queue[];
    },
    enabled: isAdmin,
  });

  const reports = useQuery({
    queryKey: ["mod-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, reason, resolved, created_at, post_id, posts(body, script, status)")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        reason: string;
        created_at: string;
        post_id: string;
        posts: { body: string; script: string; status: string } | null;
      }[];
    },
    enabled: isAdmin,
  });

  if (loading) return <p className="p-8 text-center text-sm text-muted-foreground">…</p>;
  if (!isAdmin) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Moderator access only.
      </p>
    );
  }

  const setStatus = async (postId: string, status: "live" | "removed") => {
    const { error } = await supabase.from("posts").update({ status }).eq("id", postId);
    if (error) toast.error("Could not update");
    else {
      toast.success(status === "live" ? "Approved" : "Removed");
      void queue.refetch();
      void reports.refetch();
    }
  };

  const resolve = async (reportId: string) => {
      await supabase.from("reports").update({ resolved: true }).eq("id", reportId);
    void reports.refetch();
  };

  return (
    <div>
      <PageHeader title="Moderation" subtitle="Keep the mehfil clean" />
      <div className="space-y-8 px-4 pb-10">
        <section>
          <h2 className="mb-3 px-1 font-display text-lg text-gold">
            Flagged by filter ({queue.data?.length ?? 0})
          </h2>
          <div className="space-y-3">
            {queue.data?.map((p) => (
              <div key={p.id} className="surface-card p-4">
                <p className={cn("text-base whitespace-pre-wrap", scriptClass(p.script))}>
                  {p.body}
                </p>
                <p className="mt-2 font-ui text-xs text-muted-foreground">
                  {p.kind} · {p.status} · {timeAgo(p.created_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setStatus(p.id, "live")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "removed")}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {queue.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing pending.</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 px-1 font-display text-lg text-gold">
            Open reports ({reports.data?.length ?? 0})
          </h2>
          <div className="space-y-3">
            {reports.data?.map((r) => (
              <div key={r.id} className="surface-card p-4">
                <p
                  className={cn(
                    "line-clamp-4 text-sm whitespace-pre-wrap",
                    scriptClass(r.posts?.script ?? "roman"),
                  )}
                >
                  {r.posts?.body ?? "(deleted)"}
                </p>
                <p className="mt-2 font-ui text-xs text-muted-foreground">
                  {r.reason} · {timeAgo(r.created_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.post_id, "removed")}>
                    Remove post
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
            {reports.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open reports.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}