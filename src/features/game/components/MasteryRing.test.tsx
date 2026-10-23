// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

vi.mock("framer-motion", () => ({ useReducedMotion: () => true }))

import { MasteryRing } from "./MasteryRing"

const VIEWBOX = 160
const STROKE = 30
const CIRCUMFERENCE = 2 * Math.PI * ((VIEWBOX - STROKE) / 2)

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("MasteryRing", () => {
  it("n'est pas à l'écran tant que la récompense n'est pas projetée", () => {
    render(
      <MasteryRing
        grade="NOVICE"
        nextGrade="APPRENTI"
        remainingXp={246}
        xpGained={null}
      />
    )
    const ring = screen.getByTestId("mastery-ring")
    expect(ring).toHaveStyle({ opacity: "0" })
    expect(screen.queryByTestId("mastery-ring-fill")).toBeNull()
  })

  it("affiche le grade et les XP du sujet, pas un niveau de compte", async () => {
    render(
      <MasteryRing
        grade="NOVICE"
        nextGrade="APPRENTI"
        remainingXp={246}
        xpGained={54}
      />
    )
    const fill = await screen.findByTestId("mastery-ring-fill")
    await waitFor(() =>
      expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(
        CIRCUMFERENCE * (1 - 0.18)
      )
    )
    expect(screen.getByText("Novice")).toBeInTheDocument()
    expect(screen.getByText("54")).toBeInTheDocument()
    expect(screen.getByText("246")).toBeInTheDocument()
    expect(screen.getByText("XP AVANT APPRENTI")).toBeInTheDocument()
    expect(screen.getByTestId("mastery-ring")).toHaveAttribute(
      "aria-label",
      "Maîtrise Novice : 54 XP gagnée, 246 XP avant Apprenti"
    )
  })

  it("affiche un anneau plein au dernier grade", async () => {
    render(
      <MasteryRing
        grade="LEGENDE"
        nextGrade={null}
        remainingXp={0}
        xpGained={80}
      />
    )
    const fill = await screen.findByTestId("mastery-ring-fill")
    await waitFor(() =>
      expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(0)
    )
    expect(screen.getByText("GRADE MAXIMAL")).toBeInTheDocument()
  })
})
