// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

/** Reveal posé immédiatement : états finaux déterministes, sans horloge d'animation. */
vi.mock("framer-motion", () => ({ useReducedMotion: () => true }))

import { LevelRing } from "./LevelRing"

const VIEWBOX = 160
const STROKE = 30
const CIRCUMFERENCE = 2 * Math.PI * ((VIEWBOX - STROKE) / 2)

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("LevelRing", () => {
  it("reste en attente (···, aucun segment) tant que la récompense n'est pas projetée", () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={null}
        revealStarted
        appearMs={0}
      />
    )
    expect(screen.getAllByText("···")).toHaveLength(2)
    expect(screen.queryByTestId("level-ring-fill")).toBeNull()
  })

  it("affiche son état d'attente (···, arc neutre) tant que l'ouverture n'est pas terminée", async () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted={false}
        appearMs={640}
      />
    )
    expect(screen.getAllByText("···")).toHaveLength(2)
    expect(screen.queryByTestId("level-ring-fill")).toBeNull()
    expect(screen.getByTestId("level-ring")).toHaveAttribute(
      "aria-label",
      "Level 2"
    )
  })

  it("matérialise le donut pendant le son du bilan (apparition calée sur sa durée)", async () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted={false}
        appearMs={640}
      />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveClass("qu-ring-in")
    expect(ring).toHaveStyle({ animationDuration: "640ms" })
    // L'attente n'empêche ni les libellés d'attente ni le futur reveal.
    expect(screen.getAllByText("···")).toHaveLength(2)
  })

  it("à 0 XP gagné : anneau tout blanc et valeur 0 (pas de segment corail)", async () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={0}
        revealStarted
        appearMs={0}
      />
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
      <LevelRing
        level={2}
        xpTotal={154}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted
        appearMs={0}
      />
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
})
