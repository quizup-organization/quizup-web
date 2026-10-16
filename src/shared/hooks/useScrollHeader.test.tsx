// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useScrollHeader } from "./useScrollHeader"
import type { RefObject } from "react"

/**
 * jsdom ne fait aucune mise en page : on pilote les métriques du conteneur à la main
 * (`scrollTop`, `scrollHeight`, `clientHeight`) pour rejouer un vrai cycle
 * « geste → frame → remise en page du navigateur ».
 */
interface FakeScrollElement {
  element: HTMLDivElement
  ref: RefObject<HTMLDivElement | null>
  scrollTo: (top: number, scrollHeight?: number) => void
}

function fakeScrollElement(): FakeScrollElement {
  const element = document.createElement("div")
  document.body.appendChild(element)
  let top = 0
  let scrollHeight = 2000
  const clientHeight = 600

  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value
    },
  })
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  })
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  })

  return {
    element,
    ref: { current: element },
    /** Simule un échantillon du navigateur puis l'événement `scroll` qu'il émet. */
    scrollTo: (nextTop: number, nextScrollHeight = scrollHeight) => {
      top = nextTop
      scrollHeight = nextScrollHeight
      element.dispatchEvent(new Event("scroll"))
    },
  }
}

/** Laisse la frame du hook se poser (les mises à jour passent par `requestAnimationFrame`). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe("useScrollHeader", () => {
  it("se cache en descendant puis se révèle en remontant", async () => {
    const scroll = fakeScrollElement()
    const { result } = renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(400)
    await waitFor(() => expect(result.current.hidden).toBe(true))

    scroll.scrollTo(120)
    await waitFor(() => expect(result.current.hidden).toBe(false))
  })

  it("ne bascule pas quand le contenu est remis en page (changement d'onglet)", async () => {
    const scroll = fakeScrollElement()
    const { result } = renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(1200)
    await waitFor(() => expect(result.current.hidden).toBe(true))

    // Onglet plus court : Chrome rogne alors la position — mesuré à 0 sur une page qui défile
    // encore (204 px), la position exacte dépend de son ancrage de scroll. Aucun geste : l'état
    // de l'en-tête ne doit pas bouger.
    scroll.scrollTo(0, 700)
    await settle()
    expect(result.current.hidden).toBe(true)

    // Onglet qui tient entièrement dans la fenêtre : rognage à zéro, toujours aucun geste.
    scroll.scrollTo(0, 600)
    await settle()
    expect(result.current.hidden).toBe(true)

    // Le geste suivant recale l'état : une descente à peine entamée reste visible (haut de page).
    scroll.scrollTo(30)
    await waitFor(() => expect(result.current.hidden).toBe(false))
  })

  it("reste piloté par le geste quand la hauteur ne bouge pas", async () => {
    const scroll = fakeScrollElement()
    const { result } = renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(1200)
    await waitFor(() => expect(result.current.hidden).toBe(true))

    scroll.scrollTo(600)
    await waitFor(() => expect(result.current.hidden).toBe(false))
  })
})
