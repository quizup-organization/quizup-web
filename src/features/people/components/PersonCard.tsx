import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/shared/components/user-avatar";
import { isOnline } from "@/features/player/domain/presence";
import type { Presence } from "@/features/player/domain/presence";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";

/** Pastille de présence compacte (le libellé complet est réservé aux fiches). */
function PresenceDot({ presence }: { presence: Presence | null }) {
  const online = isOnline(presence);
  const label = online
    ? "En ligne"
    : presence?.lastSeenAt
      ? "Vu récemment"
      : "Hors ligne";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        online ? "bg-[var(--duel-correct-accent)]" : "bg-muted-foreground/40",
      )}
    />
  );
}

/**
 * Carte de personne — design shadcn (Card neutre) et **disposition horizontale** des cartes
 * de sujet : avatar 46 px, nom en display, niveau en sous-titre et présence à droite.
 */
export function PersonCard({
  person,
  onOpen,
}: {
  person: PlayerCardView;
  onOpen: (userId: string) => void;
}) {
  const name = person.pseudonym ?? "Joueur";

  return (
    <Card
      size="sm"
      onClick={() => onOpen(person.userId)}
      className="cursor-pointer gap-0 transition-[color,box-shadow] hover:ring-foreground/25"
    >
      <CardContent className="flex items-center gap-3.5">
        <UserAvatar
          name={name}
          userId={person.userId}
          avatarOptions={person.avatarOptions ?? undefined}
          size={46}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-[13px] font-extrabold tracking-tight">
            {name}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            Niveau {person.level}
          </div>
        </div>
        <PresenceDot presence={person.presence} />
      </CardContent>
    </Card>
  );
}
