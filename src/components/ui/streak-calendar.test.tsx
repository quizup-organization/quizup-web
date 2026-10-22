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
    expect(missed?.className).toContain("bg-destructive")
    expect(missed?.className).toContain("text-white")
    expect(missed?.querySelector(".lucide-x")).not.toBeNull()
  })

  it("affiche les jours validés en vert avec une coche blanche", () => {
    const referenceDate = new Date()
    referenceDate.setDate(referenceDate.getDate() - 7)
    const key = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`

    render(
      <StreakCalendar
        view="week"
        streak={[{ periodStart: key, periodEnd: key }]}
        referenceDate={referenceDate}
        locale="fr-FR"
        startOfWeek={1}
      />
    )

    const active = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("série active"))

    expect(active?.className).toContain("bg-success-600")
    expect(active?.className).toContain("text-white")
    expect(active?.querySelector(".lucide-check")).not.toBeNull()
  })
})
