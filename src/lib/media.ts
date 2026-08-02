import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export async function signedUrl(bucket: "avatars" | "reels", path?: string | null) {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  if (cache.has(key)) return cache.get(key)!;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  if (!data?.signedUrl) return null;
  cache.set(key, data.signedUrl);
  return data.signedUrl;
}