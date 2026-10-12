import { useTranslation } from "react-i18next";
import { EntityTile } from "@/shared/components/entity-tile";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";
import { PresenceDot } from "./PresenceDot";

/**
 * Tuile de personne **springboard iOS** (vue compacte optionnelle) : avatar 56 px avec le
 * voyant de présence ancré, nom seul — aucune carte, aucun niveau (la fiche joueur porte
 * le détail).
 */
export function PersonTile({
  person,
  onOpen,
}: {
  person: PlayerCardView;
  onOpen: (userId: string) => void;
}) {
  const { t } = useTranslation();
  const name = person.pseudonym ?? t("people.card.fallbackName");

  return (
    <EntityTile
      dataSlot="person-tile"
      visual={
        <span className="relative shrink-0">
          <UserAvatar
            name={name}
            userId={person.userId}
            avatarOptions={person.avatarOptions ?? undefined}
            size={56}
          />
          <PresenceDot presence={person.presence} borderClassName="border-background" />
        </span>
      }
      title={name}
      onClick={() => onOpen(person.userId)}
    />
  );
}
