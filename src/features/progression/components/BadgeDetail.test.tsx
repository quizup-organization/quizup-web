// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type { BadgeItem } from "../domain/progression"
import { BadgeDetail } from "./BadgeDetail"

function badge(overrides: Partial<BadgeItem> = {}): BadgeItem {
  return {
    code: "DUELIST_BRONZE",
    label: "Duelliste",
    tier: "BRONZE",
    metric: "HUMAN_DUELS",
    target: 10,
    earned: false,
    progress: 0,
    ...overrides,
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("BadgeDetail", () => {
  it("acquis : coche sur l'objectif, sans palier ni « Débloqué » en texte", () => {
    const { container } = render(
      <BadgeDetail
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
      />
    )

    expect(
      screen.getByText("Joue 10 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(container.querySelector(".lucide-check")).not.toBeNull()
    expect(screen.queryByText("Bronze")).toBeNull()
    expect(screen.queryByText("Débloqué")).toBeNull()
  })

  it("verrouillé : objectif et reste à faire sur deux lignes distinctes", () => {
    render(<BadgeDetail family="VOLUME" badge={badge({ progress: 7 })} />)

    expect(
      screen.getByText("Joue 10 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Joue encore 3 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(screen.getByText("7 sur 10")).toBeInTheDocument()
    expect(screen.queryByText("Débloqué")).toBeNull()
  })

  it("série : l'objectif et le reste à faire sont explicites", () => {
    render(
      <BadgeDetail
        family="SERIES"
        badge={badge({
          code: "SERIES_BRONZE",
          label: "En série",
          metric: "WIN_STREAK",
          target: 4,
          progress: 3,
        })}
      />
    )

    expect(
      screen.getByText("Enchaîne 4 victoire(s) d'affilée")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Enchaîne encore 1 victoire(s) d'affilée")
    ).toBeInTheDocument()
    expect(screen.getByText("3 sur 4")).toBeInTheDocument()
  })
})
