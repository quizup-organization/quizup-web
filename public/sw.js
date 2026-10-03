/**
 * Service Worker QuizUp — cache-first des images externes.
 *
 * Les visuels de sujets/questions viennent de Wikimedia via `Special:FilePath` : la chaîne de
 * redirections n'est pas cacheable (`max-age=0, must-revalidate`) et l'image finale n'a pas de
 * `Cache-Control`. On court-circuite donc les redirections en gardant la réponse finale sous
 * l'URL d'origine : les visites suivantes (et les questions de duel) sont servies instantanément.
 *
 * Ne touche QUE les hôtes d'images : bundles, `index.html` et HMR restent intacts.
 */
const CACHE = "quizup-images-v2";
const CACHE_PREFIX = "quizup-images-";
const IMAGE_HOSTS = new Set([
  "commons.wikimedia.org",
  "thumb.wikimedia.org",
  "upload.wikimedia.org",
]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!IMAGE_HOSTS.has(url.hostname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        // Requête d'origine (no-cors) : les redirections Wikimedia n'exposent pas d'en-tête CORS,
        // un fetch CORS échouerait. La réponse opaque est acceptée par le Cache API (l'URL est
        // alors réécrite sur celle de la requête) et rejouable telle quelle pour le `<img>`.
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
