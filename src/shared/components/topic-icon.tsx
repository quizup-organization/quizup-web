import { createElement, useState, type CSSProperties } from "react";
import { cn } from "cn";
import { categoryColor, categoryIcon } from "@/shared/utils/categories";

/**
 * Pastille de sujet. Contenu : image de couverture si fournie, sinon **icône lucide de la
 * catégorie** (le sujet a une catégorie), sinon emoji (surfaces hors catalogue : palette ⌘K,
 * duel), sinon rien. Fond : couleur éditoriale du sujet, repli couleur de catégorie — jamais
 * de rond gris vide ; un visuel couvre la pastille (aucun fond forcé derrière l'image).
 * Deux modes de remplissage : `fluid` (carré pleine largeur, tuiles springboard) et `fill`
 * (remplit tout le conteneur, bandeau des cartes).
 *
 * Tant que l'image réseau n'est pas chargée, un **skeleton pulsé** la remplace ; elle
 * apparaît ensuite en fondu.
 */
interface TopicIconProps {
  topic: {
    emoji: string | null;
    color: string | null;
    imageUrl?: string | null;
    category?: string | null;
  };
  size?: number;
  className?: string;
  /** Remplit la largeur du conteneur en carré (`aspect-square`) — tuiles springboard fluides. */
  fluid?: boolean;
  /** Remplit le conteneur en absolu (largeur **et** hauteur) — bandeau visuel des cartes. */
  fill?: boolean;
  /** `eager` + `fetchPriority="high"` pour les visuels au-dessus de la ligne de flottaison. */
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

export function TopicIcon({
  topic,
  size = 44,
  className,
  fluid = false,
  fill = false,
  loading = "lazy",
  fetchPriority = "auto",
}: TopicIconProps) {
  const category = topic.category ?? "";
  const imageUrl = topic.imageUrl ?? null;
  const hasImage = Boolean(imageUrl);
  const background =
    topic.color ?? (category ? categoryColor(category) : null) ?? "var(--muted)";
  const stretches = fluid || fill;

  /** URL dont l'image est chargée (comparaison par URL : pas de flash au changement de sujet). */
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const loaded = imageUrl !== null && loadedUrl === imageUrl;

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl select-none",
        fluid && "@container aspect-square w-full",
        fill && "@container absolute inset-0 rounded-none",
        className,
      )}
      style={
        {
          width: fill ? undefined : fluid ? "100%" : size,
          height: fill ? undefined : fluid ? "auto" : size,
          // Un visuel de sujet couvre la pastille : aucun fond coloré (l'image seule décide).
          backgroundColor: hasImage ? "transparent" : background,
          fontSize: stretches ? undefined : size * 0.5,
          lineHeight: 1,
        } as CSSProperties
      }
    >
      {imageUrl ? (
        <>
          {!loaded && (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse rounded-[inherit] bg-muted/50 motion-reduce:animate-none"
            />
          )}
          <img
            src={imageUrl}
            alt=""
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            onLoad={() => setLoadedUrl(imageUrl)}
            onError={() => setLoadedUrl(imageUrl)}
            // Image déjà en cache (SW cache-first) : pas de flash de skeleton.
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setLoadedUrl(imageUrl);
            }}
            // Remplissage absolu : indépendant des hauteurs en pourcentage (parent en
            // `aspect-ratio`), l'image couvre la pastille dans tous les moteurs.
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
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
  );
}
