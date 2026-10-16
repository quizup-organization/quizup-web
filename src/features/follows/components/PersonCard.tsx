import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/shared/components/user-avatar"
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile"
import { PresenceDot } from "./PresenceDot"

/**
 * Carte de personne (tablette/desktop) — design shadcn (Card neutre), disposition horizontale :
 * avatar 46 px avec le voyant de présence en badge, nom en display et niveau en sous-titre.
 * Le compact utilise les tuiles springboard (`PersonTile`).
 */
export function PersonCard({
  person,
  onOpen,
}: {
  person: PlayerCardView
  onOpen: (userId: string) => void
}) {
  const { t } = useTranslation()
  const name = person.pseudonym ?? t("people.card.fallbackName")

  return (
    <Card
      size="sm"
      onClick={() => onOpen(person.userId)}
      className="cursor-pointer gap-0 transition-[color,border-color,transform] hover:border-foreground/25 active:scale-[0.99]"
    >
      <CardContent className="flex items-center gap-3.5">
        <span className="relative shrink-0">
          <UserAvatar
            name={name}
            userId={person.userId}
            avatarOptions={person.avatarOptions ?? undefined}
            size={46}
          />
          <PresenceDot presence={person.presence} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 font-heading text-sm font-extrabold tracking-tight">
            {name}
          </div>
          <div className="mt-0.5 truncate text-2xs text-muted-foreground">
            {t("people.card.level", { level: person.level })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
