import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

/**
 * Setup Vitest commun : matchers DOM (`@testing-library/jest-dom`) + nettoyage du rendu entre
 * les tests. Les tests de composants déclarent `// @vitest-environment jsdom` en tête de fichier
 * (par défaut : `node`, pour les tests purs de domain/lib).
 */

afterEach(() => {
  cleanup()
})

/** jsdom n'implémente pas `matchMedia` : stub neutre (aucune requête ne matche → « tablette »). */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}
