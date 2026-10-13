import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDataUri, parseAvatarOptions } from "@/shared/avatar/avatar"
import {
  getLoadedAvatarStyle,
  loadAvatarStyle,
  resolveAvatarStyleId,
} from "@/shared/avatar/styles"

/**
 * Avatar joueur — rend l'avatar DiceBear (style micah par défaut) dérivé des options
 * persistées du profil, ou déterministiquement du `userId`/nom à défaut.
 *
 * Les styles autres que le défaut sont **chargés à la demande** (chunks séparés) : le repli
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
  className,
}: UserAvatarProps) {
  const options = useMemo(
    () => parseAvatarOptions(avatarOptions),
    [avatarOptions]
  )
  const seed = userId ?? name
  const styleId = resolveAvatarStyleId(options?.style)

  // Style non embarqué (lorelei/notionists) : chargé au premier rendu, re-rendu une fois prêt.
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

  const style: CSSProperties = {
    width: fluid ? "100%" : size,
    height: fluid ? "100%" : size,
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: size * 0.36,
    letterSpacing: "-0.02em",
  }

  return (
    <Avatar
      className={cn(
        "shrink-0 overflow-hidden rounded-full bg-transparent after:hidden",
        className
      )}
      style={style}
    >
      <AvatarImage src={src} alt="" className="rounded-full" />
      <AvatarFallback className="bg-muted text-inherit">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
