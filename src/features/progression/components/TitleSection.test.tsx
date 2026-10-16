// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerTitles } from "../domain/progression"

const equip = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))

vi.mock("../hooks/useEquipTitle", () => ({ useEquipTitle: () => equip }))
vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: Record<string, string> | null | undefined) =>
    names?.fr ?? "",
}))
vi.mock("./TitlePickerDialog", () => ({
  TitlePickerDialog: ({ open }: { open: boolean }) =>
    open ? <div>picker-ouvert</div> : null,
}))

import { TitleSection } from "./TitleSection"

const UNLOCKED = {
  key: "topic-a:CONFIRME",
  topicId: "topic-a",
  grade: "CONFIRME" as const,
  gradeProgressPercent: 30,
  gradeRemainingXp: 2_750,
  nextGrade: "EXPERT" as const,
  topic: {
    topicId: "topic-a",
    names: { fr: "Histoire" },
    category: null,
    emoji: "🏛️",
    color: null,
    imageUrl: null,
    titles: null,
  },
}

const WITH_TITLE: PlayerTitles = {
  equippedKey: "topic-a:CONFIRME",
  titles: [UNLOCKED],
}

const WITHOUT_TITLE: PlayerTitles = {
  equippedKey: null,
  titles: [UNLOCKED],
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  equip.mutate.mockClear()
})

describe("TitleSection", () => {
  it("avec titre : libellé composé, grade et retrait (hors popup)", async () => {
    const user = userEvent.setup()
    render(<TitleSection userId="u1" titles={WITH_TITLE} />)

    expect(screen.getByText("Confirmé · Histoire")).toBeInTheDocument()
    expect(screen.getByText("Confirmé")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Retirer le titre" }))
    expect(equip.mutate).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it("sans titre : invite affichée, aucun retrait proposé", () => {
    render(<TitleSection userId="u1" titles={WITHOUT_TITLE} />)

    expect(screen.getByText("Aucun titre affiché")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Retirer le titre" })
    ).toBeNull()
  })

  it("ouvre le sélecteur de titres", async () => {
    const user = userEvent.setup()
    render(<TitleSection userId="u1" titles={WITHOUT_TITLE} />)

    expect(screen.queryByText("picker-ouvert")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Choisir un titre" }))
    expect(screen.getByText("picker-ouvert")).toBeInTheDocument()
  })
})
