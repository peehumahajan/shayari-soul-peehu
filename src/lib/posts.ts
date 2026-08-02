import { supabase } from "@/integrations/supabase/client";

export type PostRow = {
  id: string;
  author_id: string;
  kind: "text" | "reel";
  body: string;
  script: string;
  category: string;
  video_url: string | null;
  status: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_premium: boolean;
  } | null;
};

const SELECT =
  "id, author_id, kind, body, script, category, video_url, status, like_count, comment_count, created_at, profiles!posts_author_profile_fkey(username, display_name, avatar_url, is_premium)";

type FeedOptions = {
  sort?: "trending" | "fresh";
  kind?: "text" | "reel";
  category?: string | null;
  authorId?: string;
  limit?: number;
};

export async function fetchFeed(opts: FeedOptions = {}) {
  let q = supabase.from("posts").select(SELECT).eq("status", "live");
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  q =
    opts.sort === "fresh"
      ? q.order("created_at", { ascending: false })
      : q.order("trending_score", { ascending: false }).order("created_at", { ascending: false });
  const { data, error } = await q.limit(opts.limit ?? 40);
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

export async function fetchPost(id: string) {
  const { data, error } = await supabase.from("posts").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as PostRow | null;
}

export async function fetchMyPosts(uid: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(SELECT)
    .eq("author_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

export async function fetchMyLikes(uid: string) {
  const { data } = await supabase.from("likes").select("post_id").eq("user_id", uid);
  return new Set((data ?? []).map((r) => r.post_id));
}

export async function fetchMyBookmarks(uid: string) {
  const { data } = await supabase.from("bookmarks").select("post_id").eq("user_id", uid);
  return new Set((data ?? []).map((r) => r.post_id));
}

export async function fetchSaved(uid: string) {
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`post_id, posts!inner(${SELECT})`)
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => (r as unknown as { posts: PostRow }).posts).filter(Boolean);
}

export async function toggleLike(postId: string, uid: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: uid });
    if (error) throw error;
  }
}

export async function toggleBookmark(postId: string, uid: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("bookmarks").insert({ post_id: postId, user_id: uid });
    if (error) throw error;
  }
}

export async function reportPost(postId: string, uid: string, reason: string) {
  const { error } = await supabase
    .from("reports")
    .insert({ post_id: postId, reporter_id: uid, reason });
  if (error) throw error;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, user_id, profiles!comments_user_profile_fkey(username, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    profiles: { username: string; avatar_url: string | null } | null;
  }[];
}