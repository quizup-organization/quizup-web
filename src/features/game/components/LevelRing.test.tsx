// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import i18n from "@/lib/i18n"
import { RING_REVEAL_MS } from "../domain/game-constants"

/** Reveal posé immédiatement (défaut) ou piloté image par image (décompte) selon le test. */
const motion = vi.hoisted(() => ({ reduced: true }))
vi.mock("framer-motion", () => ({ useReducedMotion: () => motion.reduced }))

import { LevelRing } from "./LevelRing"

const VIEWBOX = 160
const STROKE = 30
const CIRCUMFERENCE = 2 * Math.PI * ((VIEWBOX - STROKE) / 2)

/** Vide la file de `requestAnimationFrame` en avançant l'horloge d'animation. */
function flushFrames(frames: FrameRequestCallback[], time: number): void {
  const pending = frames.splice(0, frames.length)
  pending.forEach((callback) => callback(time))
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  motion.reduced = true
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("LevelRing", () => {
  it("n'est pas à l'écran tant que la récompense n'est pas projetée (aucun état transitoire)", () => {
    render(
      <LevelRing level={2} xpTotal={100} xpForNextLevel={400} xpGained={null} />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveStyle({ opacity: "0" })
    expect(ring).not.toHaveClass("qu-pop")
    expect(screen.queryByText("···")).toBeNull()
    expect(screen.queryByTestId("level-ring-fill")).toBeNull()
  })

  it("s'anime dès que la récompense est disponible (entrée de page, animation `qu-pop`)", async () => {
    const { rerender } = render(
      <LevelRing level={2} xpTotal={100} xpForNextLevel={400} xpGained={null} />
    )
    expect(screen.getByTestId("level-ring")).not.toHaveClass("qu-pop")

    rerender(
      <LevelRing level={2} xpTotal={100} xpForNextLevel={400} xpGained={54} />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveClass("qu-pop")
    expect(ring).not.toHaveStyle({ opacity: "0" })
    // Les valeurs révélées accompagnent l'entrée du donut (jamais de `···`).
    expect(await screen.findByText("54")).toBeInTheDocument()
    expect(screen.queryByText("···")).toBeNull()
  })

  it("à 0 XP gagné : anneau tout blanc et valeur 0 (pas de segment corail)", async () => {
    render(
      <LevelRing level={2} xpTotal={100} xpForNextLevel={400} xpGained={0} />
    )
    const fill = await screen.findByTestId("level-ring-fill")
    await waitFor(() =>
      expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(
        CIRCUMFERENCE
      )
    )
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("300")).toBeInTheDocument()
  })

  it("remplit l'anneau au prorata de l'XP gagnée face à l'XP restante", async () => {
    render(
      <LevelRing level={2} xpTotal={154} xpForNextLevel={400} xpGained={54} />
    )
    const fill = await screen.findByTestId("level-ring-fill")
    // 54 gagnés / (54 + 246 restants) = 18 %.
    await waitFor(() =>
      expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(
        CIRCUMFERENCE * (1 - 0.18)
      )
    )
    expect(screen.getByText("54")).toBeInTheDocument()
    expect(screen.getByText("246")).toBeInTheDocument()
    expect(screen.getByTestId("level-ring")).toHaveAttribute(
      "aria-label",
      "Niveau 2 : 54 XP gagnée, 246 XP avant le niveau 3"
    )
  })

  it("décompte « XP pour le niveau X » quand « XP gagnée » monte (somme constante)", () => {
    motion.reduced = false
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal("cancelAnimationFrame", () => {})

    render(
      <LevelRing level={2} xpTotal={154} xpForNextLevel={400} xpGained={54} />
    )

    // Première image : l'arc est encore tout blanc → « XP gagnée » 0, reste = 54 + 246 = 300.
    act(() => flushFrames(frames, 0))
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("300")).toBeInTheDocument()

    // Mi-reveal : corail 27, blanc 273 (la somme reste 300).
    act(() => flushFrames(frames, RING_REVEAL_MS / 2))
    expect(screen.getByText("27")).toBeInTheDocument()
    expect(screen.getByText("273")).toBeInTheDocument()

    // Fin : corail 54, blanc 246 (le restant d'après le duel).
    act(() => flushFrames(frames, RING_REVEAL_MS))
    expect(screen.getByText("54")).toBeInTheDocument()
    expect(screen.getByText("246")).toBeInTheDocument()
  })

  it("ancre les callouts au conteneur (repli du libellé plutôt que débordement)", () => {
    render(
      <LevelRing level={2} xpTotal={154} xpForNextLevel={400} xpGained={54} />
    )
    const remainingLabel = screen.getByText("XP POUR LE NIVEAU 3")
    // Le libellé peut replier plutôt que de dépasser : plus de `nowrap`…
    expect(remainingLabel).not.toHaveStyle({ whiteSpace: "nowrap" })
    // … et le callout est ancré au conteneur `level-ring` (pleine largeur), qui borne donc sa
    // largeur (position absolue `shrink-to-fit`) : le libellé replie au lieu de déborder.
    const root = screen.getByTestId("level-ring")
    const remainingCallout = remainingLabel.parentElement?.parentElement
    expect(remainingCallout?.parentElement).toBe(root)
    expect(remainingCallout?.style.right).toContain("calc(50% +")
    const gainedCallout =
      screen.getByText("XP GAGNÉE").parentElement?.parentElement
    expect(gainedCallout?.parentElement).toBe(root)
    expect(gainedCallout?.style.left).toContain("calc(50% +")
  })
})
