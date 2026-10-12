import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { isOnline } from "@/features/player/domain/presence";
import type { Presence } from "@/features/player/domain/presence";

/**
 * Voyant de présence en badge sur l'avatar (le libellé complet est réservé aux fiches).
 * `borderClassName` aligne l'anneau sur la surface porteuse : `border-card` sur une Card,
 * `border-background` sur le fond de page (tuiles springboard).
 */
export function PresenceDot({
  presence,
  borderClassName = "border-card",
}: {
  presence: Presence | null;
  borderClassName?: string;
}) {
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
        "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2",
        borderClassName,
        online ? "bg-[var(--duel-correct-accent)]" : "bg-muted-foreground/40",
      )}
    />
  );
}
