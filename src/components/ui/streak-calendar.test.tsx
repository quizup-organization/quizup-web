// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StreakCalendar } from "./streak-calendar"

describe("StreakCalendar", () => {
  it("marque en rouge les jours passés sans activité", () => {
    const referenceDate = new Date()
    referenceDate.setDate(referenceDate.getDate() - 7)

    render(
      <StreakCalendar
        view="week"
        streak={[]}
        referenceDate={referenceDate}
        locale="fr-FR"
        startOfWeek={1}
      />
    )

    const missed = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("jour manqué"))

    expect(missed).toBeDefined()
    expect(missed?.className).toContain("bg-destructive/15")
  })
})
