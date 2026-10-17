// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { GameHistoryItem } from "../domain/history"
import { MatchList } from "./MatchList"

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

function item(outcome: GameHistoryItem["outcome"]): GameHistoryItem {
  return {
    gameId: `game-${outcome}`,
    topic: {
      topicId: "topic-1",
      names: { fr: "Histoire" },
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
      titles: null,
    },
    opponent: null,
    opponentType: "BOT",
    outcome,
    myScore: 120,
    opponentScore: 90,
    xp: null,
    playedAt: "2026-10-17T10:00:00Z",
  }
}

function renderList(items: GameHistoryItem[]) {
  return render(
    <MemoryRouter>
      <MatchList items={items} />
    </MemoryRouter>
  )
}

describe("MatchList", () => {
  it("remplace Victoire / Égalité / Défaite par une pastille icône blanche", () => {
    renderList([item("WIN"), item("DRAW"), item("LOSS")])

    // Plus aucun libellé texte pour les issues terminées.
    expect(screen.queryByText("Victoire")).toBeNull()
    expect(screen.queryByText("Égalité")).toBeNull()
    expect(screen.queryByText("Défaite")).toBeNull()

    const win = screen.getByRole("img", { name: "Victoire" })
    const draw = screen.getByRole("img", { name: "Égalité" })
    const loss = screen.getByRole("img", { name: "Défaite" })

    expect(win.className).toContain("rounded-full")
    expect(win.className).toContain("text-white")
    expect(win.getAttribute("style")).toContain("--win")
    expect(draw.getAttribute("style")).toContain("--draw")
    expect(loss.getAttribute("style")).toContain("--loss")
    expect(win.querySelector(".lucide-check")).not.toBeNull()
    expect(draw.querySelector(".lucide-equal")).not.toBeNull()
    expect(loss.querySelector(".lucide-x")).not.toBeNull()
  })

  it("garde le libellé texte des issues non terminées", () => {
    renderList([item("WAITING")])

    expect(screen.getByText("En attente")).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "En attente" })).toBeNull()
  })
})
