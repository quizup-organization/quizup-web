// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { ResultActions } from "./ResultActions"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

const BASE_PROPS = {
  botGame: false,
  onReplayBot: vi.fn(),
  onChallengeRematch: vi.fn(),
  onNewOpponent: vi.fn(),
  rematchPending: false,
  rematchRefused: false,
}

describe("ResultActions", () => {
  it("rend le signalement comme une action jaune pleine largeur", () => {
    render(
      <ResultActions {...BASE_PROPS} reportable onReportOpponent={vi.fn()} />
    )

    const report = screen.getByRole("button", { name: "Signaler" })
    expect(report).toHaveClass("w-full")
    expect(report.getAttribute("style")).toContain("var(--duel-gauge)")
    expect(report).toBeEnabled()
  })

  it("désactive le signalement une fois le joueur signalé", () => {
    render(
      <ResultActions
        {...BASE_PROPS}
        reportable
        reported
        onReportOpponent={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Signalé" })).toBeDisabled()
  })
})
