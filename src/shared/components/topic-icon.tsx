import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { cn } from "cn"
import { categoryColor, categoryIcon } from "@/shared/utils/categories"

/**
 * Pastille de sujet — **forme springboard iOS** (rayon 22 % + ombre légère, comme les tuiles
 * d'accueil). Contenu : image de couverture si fournie, sinon **icône lucide de la
 * catégorie** (le sujet a une catégorie), sinon emoji (surfaces hors catalogue : palette ⌘K,
 * duel), sinon rien. Fond : couleur éditoriale du sujet, repli couleur de catégorie — jamais
 * de rond gris vide ; un visuel couvre la pastille (aucun fond forcé derrière l'image).
 * Deux modes de remplissage : `fluid` (carré pleine largeur, tuiles springboard) et `fill`
 * (remplit tout le conteneur, bandeau des cartes — angles droits, sans ombre).
 *
 * État d'image (`loading`/`loaded`/`error`) suivi **par URL** et corrélé à l'élément réel :
 * skeleton pulsé pendant le chargement, fondu à l'arrivée, et **repli visuel** (icône de la
 * catégorie sur la couleur du sujet) en cas d'échec — jamais d'image invisible.
 */
interface TopicIconProps {
  topic: {
    emoji: string | null
    color: string | null
    imageUrl?: string | null
    category?: string | null
  }
  size?: number
  className?: string
  /** Remplit la largeur du conteneur en carré (`aspect-square`) — tuiles springboard fluides. */
  fluid?: boolean
  /** Remplit le conteneur en absolu (largeur **et** hauteur) — bandeau visuel des cartes. */
  fill?: boolean
  /** `eager` + `fetchPriority="high"` pour les visuels au-dessus de la ligne de flottaison. */
  loading?: "lazy" | "eager"
  fetchPriority?: "high" | "low" | "auto"
}

type ImageState = "loading" | "loaded" | "error"

export function TopicIcon({
  topic,
  size = 44,
  className,
  fluid = false,
  fill = false,
  loading = "lazy",
  fetchPriority = "auto",
}: TopicIconProps) {
  const category = topic.category ?? ""
  const imageUrl = topic.imageUrl ?? null
  const hasImage = Boolean(imageUrl)
  const background =
    topic.color ?? (category ? categoryColor(category) : null) ?? "var(--muted)"
  const stretches = fluid || fill

  // État indexé par URL : un changement de sujet repart naturellement de `loading`.
  const [image, setImage] = useState<{ url: string; state: ImageState } | null>(
    null
  )
  const state: ImageState =
    imageUrl !== null && image?.url === imageUrl ? image.state : "loading"
  const showImage = hasImage && state !== "error"
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Ne re-render que si l'état change réellement (la ref inline est rappelée à chaque rendu).
  const mark = (url: string, next: ImageState) =>
    setImage((prev) =>
      prev && prev.url === url && prev.state === next
        ? prev
        : { url, state: next }
    )

  // Une image déjà en cache (ou déjà en échec) est `complete` avant que React n'attache
  // `onLoad` : on lit l'état réel de l'élément après montage/rendu.
  useEffect(() => {
    const node = imgRef.current
    if (!node || !imageUrl || image?.url === imageUrl || !node.complete) return
    mark(imageUrl, node.naturalWidth > 0 ? "loaded" : "error")
  })

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[22%] shadow-md select-none",
        fluid && "@container aspect-square w-full",
        fill && "@container absolute inset-0 rounded-none shadow-none",
        className
      )}
      style={
        {
          width: fill ? undefined : fluid ? "100%" : size,
          height: fill ? undefined : fluid ? "auto" : size,
          // Un visuel de sujet couvre la pastille : aucun fond coloré (l'image seule décide) ;
          // en repli (pas d'image ou échec), la couleur éditoriale reprend.
          backgroundColor: showImage ? "transparent" : background,
          fontSize: stretches ? undefined : size * 0.5,
          lineHeight: 1,
        } as CSSProperties
      }
    >
      {showImage ? (
        <>
          {state === "loading" && (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse rounded-[inherit] bg-muted/50 motion-reduce:animate-none"
            />
          )}
          <img
            ref={(node) => {
              imgRef.current = node
              if (node?.complete) {
                mark(
                  imageUrl as string,
                  node.naturalWidth > 0 ? "loaded" : "error"
                )
              }
            }}
            src={imageUrl as string}
            alt=""
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            onLoad={() => mark(imageUrl as string, "loaded")}
            onError={() => mark(imageUrl as string, "error")}
            // Remplissage absolu : indépendant des hauteurs en pourcentage (parent en
            // `aspect-ratio`), l'image couvre la pastille dans tous les moteurs.
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              state === "loaded" ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      ) : category ? (
        createElement(categoryIcon(category), {
          className: "size-1/2",
          style: { color: "#ffffff" },
        })
      ) : (
        <span aria-hidden className={cn(stretches && "text-[50cqw]")}>
          {topic.emoji ?? ""}
        </span>
      )}
    </span>
  )
}
