import { cn } from "@/lib/utils";
import { timeAgo } from "@/shared/utils/time";

interface PresenceBadgeProps {
  online: boolean;
  lastSeenAt?: string | null;
  className?: string;
}

/** Pastille de présence joueur — point coloré + libellé (en ligne / vu récemment). */
export function PresenceBadge({ online, lastSeenAt, className }: PresenceBadgeProps) {
  const label = online
    ? "En ligne"
    : lastSeenAt
      ? `Vu ${timeAgo(lastSeenAt)}`
      : "Hors ligne";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          online
            ? "bg-[var(--duel-correct-accent)]"
            : "bg-muted-foreground/50",
        )}
      />
      {label}
    </span>
  );
}
