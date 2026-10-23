// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerTitles } from "../domain/progression"

const equip = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
vi.mock("../hooks/useEquipTitle", () => ({ useEquipTitle: () => equip }))
vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: Record<string, string> | null | undefined) =>
    names?.fr ?? "",
}))

import { ProfileTitlesSection } from "./ProfileTitlesSection"

const topic = {
  topicId: "topic-a",
  names: { fr: "Histoire" },
  category: null,
  emoji: "🏛️",
  color: null,
  imageUrl: null,
  titles: null,
}

const titles: PlayerTitles = {
  equippedKey: "topic-a:CONFIRME",
  titles: [
    {
      key: "topic-a:CONFIRME",
      topicId: "topic-a",
      grade: "CONFIRME",
      rank: "OR",
      gradeProgressPercent: 30,
      gradeRemainingXp: 2_750,
      nextGrade: "EXPERT",
      topic,
    },
    {
      key: "topic-b:FER",
      topicId: "topic-b",
      grade: "NOVICE",
      rank: "FER",
      gradeProgressPercent: 0,
      gradeRemainingXp: 500,
      nextGrade: "APPRENTI",
      topic: { ...topic, topicId: "topic-b", names: { fr: "Sport" } },
    },
  ],
}

function renderSection() {
  return render(
    <MemoryRouter>
      <ProfileTitlesSection userId="u1" titles={titles} />
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  equip.mutate.mockClear()
})

describe("ProfileTitlesSection", () => {
  it("liste les titres du rang le plus rare au plus commun", () => {
    renderSection()

    const labels = screen.getAllByText(/Histoire|Sport/)
    expect(labels.map((node) => node.textContent)).toEqual([
      "Or · Histoire",
      "Fer · Sport",
    ])
    expect(screen.getByText("Affiché")).toBeInTheDocument()
  })

  it("retire le titre porté et équipe un autre titre", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(screen.getByRole("button", { name: "Retirer le titre" }))
    expect(equip.mutate).toHaveBeenCalledWith(null, expect.any(Object))

    await user.click(screen.getByRole("button", { name: "Utiliser ce titre" }))
    expect(equip.mutate).toHaveBeenCalledWith("topic-b:FER", expect.any(Object))
  })
})
