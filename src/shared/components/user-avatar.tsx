import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDataUri, parseAvatarOptions } from "@/shared/avatar/avatar"
import { useEloRating } from "@/shared/elo/elo-rating-store"
import { eloTier } from "@/shared/elo/elo"
import {
  getLoadedAvatarStyle,
  loadAvatarStyle,
  resolveAvatarStyleId,
} from "@/shared/avatar/styles"

/**
 * Avatar joueur — rend l'avatar DiceBear (style micah) dérivé des options
 * persistées du profil, ou déterministiquement du `userId`/nom à défaut.
 *
 * Les styles non embarqués sont **chargés à la demande** (chunks séparés) : le repli
 * initiales (`AvatarFallback`) couvre le court intervalle de chargement, comme un `<img>` en
 * cours de résolution.
 *
 * Toutes les caractéristiques visuelles (forme, fond, couleurs) proviennent
 * **de l'avatar lui-même** : rien n'est forcé par l'appelant. La présence
 * éventuelle est indiquée par `PresenceBadge`, jamais par une bordure.
 */
interface UserAvatarProps {
  name: string
  userId?: string
  avatarOptions?: string
  size?: number
  /** Remplit la taille du conteneur (100 %) — `size` ne sert plus qu'à la résolution/fallback. */
  fluid?: boolean
  /** Bordure Elo globale ; désactivée dans la topbar/sidebar, l'éditeur d'avatar et les salons. */
  eloFrame?: boolean
  /** Rating déjà connu (ex. entrée de classement) : évite le batch. */
  rating?: number | null
  provisional?: boolean
  className?: string
}

/** Identité d'avatar (userId/options) pour transmettre l'avatar d'un joueur. */
export interface AvatarIdentity {
  userId?: string
  avatarOptions?: string
}

export function UserAvatar({
  name,
  userId,
  avatarOptions,
  size = 40,
  fluid,
  eloFrame = true,
  rating,
  provisional = false,
  className,
}: UserAvatarProps) {
  const options = useMemo(
    () => parseAvatarOptions(avatarOptions),
    [avatarOptions]
  )
  const seed = userId ?? name
  const styleId = resolveAvatarStyleId(options?.style)
  const fetched = useEloRating(eloFrame && rating == null ? userId : undefined)
  const elo = eloFrame
    ? rating != null
      ? { rating, provisional }
      : fetched
    : null
  // Même couleur que l'avatar du profil, épaisseur proportionnelle à la taille réelle
  // (`clamp` en `cqw` sur le conteneur), sans offset.
  const tier = elo ? eloTier(elo.rating) : null

  // Style non embarqué : chargé au premier rendu, re-rendu une fois prêt.
  const [styleReady, setStyleReady] = useState(
    () => getLoadedAvatarStyle(styleId) !== undefined
  )
  useEffect(() => {
    if (styleReady) return
    let cancelled = false
    void loadAvatarStyle(styleId).then(() => {
      if (!cancelled) setStyleReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [styleId, styleReady])

  const src = useMemo(
    () => (styleReady ? avatarDataUri(options, size * 2, seed) : undefined),
    [styleReady, options, size, seed]
  )

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const wrapperStyle: CSSProperties = {
    width: fluid ? "100%" : size,
    height: fluid ? "100%" : size,
    containerType: "inline-size",
  }

  const avatarStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: fluid ? undefined : size * 0.36,
    letterSpacing: "-0.02em",
    outline: tier ? "var(--elo-ring) solid" : undefined,
    outlineWidth: tier ? "clamp(1px, 5cqw, 4px)" : undefined,
    outlineOffset: tier ? 0 : undefined,
  }

  return (
    <span
      data-elo-tier={tier ?? undefined}
      className={cn("relative inline-flex shrink-0 rounded-full", className)}
      style={wrapperStyle}
    >
      <Avatar
        className={cn(
          "size-full overflow-hidden rounded-full bg-transparent after:hidden"
        )}
        style={avatarStyle}
      >
        <AvatarImage src={src} alt="" className="rounded-full" />
        <AvatarFallback
          className={cn("bg-muted text-inherit", fluid && "text-[36cqw]")}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </span>
  )
}
