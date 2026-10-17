// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type { Achievement } from "../domain/achievement"
import { useAchievementStore } from "../stores/useAchievementStore"
import { AchievementCelebration } from "./AchievementCelebration"

function renderCelebration(achievement: Achievement, queued = 1) {
  useAchievementStore.setState({
    queue: Array.from({ length: queued }, () => achievement),
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AchievementCelebration achievement={achievement} />
    </QueryClientProvider>
  )
}

beforeAll(async () => i18n.changeLanguage("fr"))
beforeEach(() => useAchievementStore.setState({ queue: [] }))

describe("AchievementCelebration", () => {
  it("célèbre un badge : nom traduit, palier et prochain palier explicite", () => {
    renderCelebration({
      kind: "BADGE",
      code: "DUELIST_ARGENT",
      label: "Bretteur",
      family: "VOLUME",
      tier: "ARGENT",
      metric: "HUMAN_DUELS",
      target: 10,
      at: "2026-10-15T18:00:00Z",
    })

    expect(screen.getByText("Succès")).toBeInTheDocument()
    expect(screen.getByText("Bretteur")).toBeInTheDocument()
    expect(screen.getByText(/Objectif : Joue 10 duel/)).toBeInTheDocument()
    expect(
      screen.getByText(/Prochain palier : Or — Lame d'élite/)
    ).toBeInTheDocument()
  })

  it("affiche la condition dédiée d'un exploit", () => {
    renderCelebration({
      kind: "BADGE",
      code: "PERFECT",
      label: "Perfectionniste",
      family: "EXPLOIT",
      tier: "OR",
      metric: "ONE_SHOT",
      target: 1,
      at: "2026-10-15T18:00:00Z",
    })

    expect(
      screen.getByText(/Objectif : Termine un duel avec le score maximal/)
    ).toBeInTheDocument()
  })

  it("célèbre un palier maximal sans annoncer de suite", () => {
    renderCelebration({
      kind: "BADGE",
      code: "DUELIST_DIAMANT",
      label: "Mythe vivant",
      family: "VOLUME",
      tier: "DIAMANT",
      metric: "HUMAN_DUELS",
      target: 1_000,
      at: "2026-10-15T18:00:00Z",
    })

    expect(screen.getByText(/palier le plus rare/)).toBeInTheDocument()
  })

  it("célèbre un niveau de compte", () => {
    renderCelebration({
      kind: "LEVEL",
      level: 12,
      accountTitle: "Confirmé",
      at: "2026-10-15T18:00:00Z",
    })

    expect(screen.getByText("Niveau 12")).toBeInTheDocument()
    expect(screen.getByText(/Confirmé/)).toBeInTheDocument()
  })

  it("passe au déblocage suivant à la fermeture", async () => {
    const achievement: Achievement = {
      kind: "BADGE",
      code: "PERFECT",
      label: "Perfectionniste",
      family: "EXPLOIT",
      tier: "OR",
      metric: "ONE_SHOT",
      target: 1,
      at: "2026-10-15T18:00:00Z",
    }
    renderCelebration(achievement)

    await userEvent.click(screen.getByRole("button", { name: "Super !" }))

    expect(useAchievementStore.getState().queue).toEqual([])
  })
})
