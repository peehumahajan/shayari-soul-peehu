import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function UserAvatar({
  path,
  name,
  className,
}: {
  path?: string | null;
  name?: string | null;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (path?.startsWith("http")) {
      setUrl(path);
    } else {
      void signedUrl("avatars", path).then((u) => {
        if (active) setUrl(u);
      });
    }
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-display text-sm text-primary",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? "Profile picture"} className="size-full object-cover" />
      ) : (
        (name ?? "?").slice(0, 1).toUpperCase()
      )}
    </span>
  );
}