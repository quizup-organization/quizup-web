// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { TIER_COLORS, type BadgeItem } from "../domain/progression"
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
  it("acquis : le palier garde **sa** teinte, seul l'état est vert", () => {
    render(
      <BadgeDetail
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
      />
    )

    expect(screen.getByText("Bronze").style.color).toBe(TIER_COLORS.BRONZE.text)
    expect(screen.getByText("Débloqué").className).toContain("text-success-600")
  })

  it("verrouillé : progression chiffrée, aucun état vert", () => {
    render(<BadgeDetail family="VOLUME" badge={badge({ progress: 7 })} />)

    expect(screen.getByText("7 sur 10")).toBeInTheDocument()
    expect(screen.queryByText("Débloqué")).toBeNull()
  })
})
