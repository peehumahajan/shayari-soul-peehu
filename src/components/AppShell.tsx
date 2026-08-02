import { Link, useRouterState } from "@tanstack/react-router";
import { Film, Home, PenLine, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Mehfil", icon: Home },
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/write", label: "Likho", icon: PenLine },
  { to: "/saved", label: "Diary", icon: Bookmark },
  { to: "/me", label: "You", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-popover/95 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-1.5 font-ui text-[0.65rem] tracking-wide transition-colors",
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", to === "/write" && active && "text-gold")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-8 pb-4">
      <div>
        <h1 className="text-gold-gradient font-display text-3xl leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}