import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/shared/components/user-avatar";
import { isOnline } from "@/features/player/domain/presence";
import type { Presence } from "@/features/player/domain/presence";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";

/** Voyant de présence en badge sur l'avatar (le libellé complet est réservé aux fiches). */
function PresenceDot({ presence }: { presence: Presence | null }) {
  const { t } = useTranslation();
  const online = isOnline(presence);
  const label = online
    ? t("people.presence.online")
    : presence?.lastSeenAt
      ? t("people.presence.recently")
      : t("people.presence.offline");

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card",
        online ? "bg-[var(--duel-correct-accent)]" : "bg-muted-foreground/40",
      )}
    />
  );
}

/**
 * Carte de personne — design shadcn (Card neutre) et **disposition horizontale** des cartes
 * de sujet : avatar 46 px avec le voyant de présence en badge, nom en display et niveau en
 * sous-titre (toute la largeur restante). En **compact**, la carte passe en colonne centrée
 * (avatar en tête) pour laisser toute la largeur au pseudo.
 */
export function PersonCard({
  person,
  onOpen,
}: {
  person: PlayerCardView;
  onOpen: (userId: string) => void;
}) {
  const { t } = useTranslation();
  const name = person.pseudonym ?? t("people.card.fallbackName");

  return (
    <Card
      size="sm"
      onClick={() => onOpen(person.userId)}
      className="cursor-pointer gap-0 transition-[color,box-shadow,transform] hover:ring-foreground/25 active:scale-[0.99]"
    >
      <CardContent className="flex items-center gap-3.5 compact:flex-col compact:gap-2.5 compact:text-center">
        <span className="relative shrink-0">
          <UserAvatar
            name={name}
            userId={person.userId}
            avatarOptions={person.avatarOptions ?? undefined}
            size={46}
          />
          <PresenceDot presence={person.presence} />
        </span>
        <div className="min-w-0 flex-1 compact:w-full compact:flex-none">
          <div className="line-clamp-1 font-heading text-sm font-extrabold tracking-tight compact:line-clamp-2">
            {name}
          </div>
          <div className="mt-0.5 truncate text-2xs text-muted-foreground">
            {t("people.card.level", { level: person.level })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
