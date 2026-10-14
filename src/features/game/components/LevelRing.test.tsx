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
  it("n'est pas à l'écran tant que la récompense n'est pas projetée (aucun état transitoire)", () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={null}
        revealStarted
      />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveStyle({ opacity: "0" })
    expect(ring).not.toHaveClass("qu-pop")
    expect(screen.queryByText("···")).toBeNull()
    expect(screen.queryByTestId("level-ring-fill")).toBeNull()
  })

  it("reste invisible tant que l'ouverture de la page n'est pas terminée", () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted={false}
      />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveStyle({ opacity: "0" })
    expect(ring).not.toHaveClass("qu-pop")
    expect(ring).toHaveAttribute("aria-label", "Level 2")
    expect(screen.queryByText("···")).toBeNull()
  })

  it("entre à l'écran avec l'animation d'ouverture de page au reveal", async () => {
    const { rerender } = render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted={false}
      />
    )
    expect(screen.getByTestId("level-ring")).not.toHaveClass("qu-pop")

    rerender(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={54}
        revealStarted
      />
    )
    const ring = screen.getByTestId("level-ring")
    expect(ring).toHaveClass("qu-pop")
    expect(ring).not.toHaveStyle({ opacity: "0" })
    // Les valeurs révélées accompagnent l'entrée du donut.
    expect(await screen.findByText("54")).toBeInTheDocument()
  })

  it("à 0 XP gagné : anneau tout blanc et valeur 0 (pas de segment corail)", async () => {
    render(
      <LevelRing
        level={2}
        xpTotal={100}
        xpForNextLevel={400}
        xpGained={0}
        revealStarted
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
