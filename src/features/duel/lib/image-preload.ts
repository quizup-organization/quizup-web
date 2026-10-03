/** URLs déjà préchargées : une seule requête par image, quel que soit le nombre d'appels. */
const preloaded = new Set<string>();

/**
 * Précharge une image de question hors du cycle React : le navigateur la met en cache avant
 * qu'elle ne soit affichée au round correspondant (les connexions faibles ne sont plus
 * pénalisées par le chargement au moment de la révélation).
 */
export function preloadImage(url: string | null | undefined): void {
  if (!url || preloaded.has(url)) return;
  preloaded.add(url);
  const image = new Image();
  image.fetchPriority = "high";
  image.decoding = "async";
  image.src = url;
}
