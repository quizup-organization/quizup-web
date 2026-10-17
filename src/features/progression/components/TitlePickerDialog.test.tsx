// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

import { TitlePickerDialog } from "./TitlePickerDialog"

/**
 * Fixture : deux sujets joués — « Confirmé · Histoire » (porté) et « Novice · DotA »
 * (grade d'entrée débloqué dès la première partie).
 */
const TITLES: PlayerTitles = {
  equippedKey: "topic-a:CONFIRME",
  titles: [
    {
      key: "topic-a:CONFIRME",
      topicId: "topic-a",
      grade: "CONFIRME",
      gradeProgressPercent: 30,
      gradeRemainingXp: 2_750,
      nextGrade: "EXPERT",
      topic: {
        topicId: "topic-a",
        names: { fr: "Histoire" },
        category: null,
        emoji: "🏛️",
        color: null,
        imageUrl: null,
        titles: null,
      },
    },
    {
      key: "topic-b:NOVICE",
      topicId: "topic-b",
      grade: "NOVICE",
      gradeProgressPercent: 40,
      gradeRemainingXp: 180,
      nextGrade: "APPRENTI",
      topic: {
        topicId: "topic-b",
        names: { fr: "DotA" },
        category: null,
        emoji: "🎮",
        color: null,
        imageUrl: null,
        titles: null,
      },
    },
  ],
}

function renderDialog(
  overrides: Partial<Parameters<typeof TitlePickerDialog>[0]> = {}
) {
  const props = {
    open: true,
    onClose: vi.fn(),
    userId: "u1",
    titles: TITLES,
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <TitlePickerDialog {...props} />
    </QueryClientProvider>
  )
  return props
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
  // Rendu **desktop** (modale centrée Radix) : jsdom n'a pas de vrai `matchMedia`.
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes("min-width: 1024px"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
})

beforeEach(() => {
  equip.mutate.mockClear()
})

describe("TitlePickerDialog", () => {
  it("liste les titres et pré-sélectionne le titre porté", () => {
    renderDialog()

    expect(screen.getByText("Confirmé · Histoire")).toBeInTheDocument()
    // Chaque ligne porte la pastille de rang : Or pour Confirmé, Fer pour Novice.
    expect(screen.getByText("Or")).toBeInTheDocument()
    expect(screen.getByText("Fer")).toBeInTheDocument()
    expect(screen.getByText("Novice · DotA")).toBeInTheDocument()
    // Progression vers le grade suivant de chaque titre.
    expect(screen.getByText(/2 750 XP avant Expert/)).toBeInTheDocument()
    // Le titre porté est déjà sélectionné : rien à appliquer.
    expect(
      screen.getByRole("button", { name: "Utiliser ce titre" })
    ).toBeDisabled()
  })

  it("filtre la liste par recherche (casse et accents ignorés)", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(
      screen.getByPlaceholderText("Rechercher un titre…"),
      "histoire"
    )

    expect(screen.getByText("Confirmé · Histoire")).toBeInTheDocument()
    expect(screen.queryByText("Novice · DotA")).toBeNull()

    await user.clear(screen.getByPlaceholderText("Rechercher un titre…"))
    await user.type(screen.getByPlaceholderText("Rechercher un titre…"), "zzz")
    expect(screen.getByText("Aucun titre ne correspond.")).toBeInTheDocument()
  })

  it("sélection puis validation : équipe le titre choisi", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /Novice · DotA/ }))
    const confirm = screen.getByRole("button", { name: "Utiliser ce titre" })
    expect(confirm).toBeEnabled()

    await user.click(confirm)
    expect(equip.mutate).toHaveBeenCalledWith(
      "topic-b:NOVICE",
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it("liste vide : invite à jouer plutôt qu'une liste muette", () => {
    renderDialog({ titles: { equippedKey: null, titles: [] } })

    expect(
      screen.getByText(
        /Joue un duel dans un sujet pour débloquer ton premier titre/
      )
    ).toBeInTheDocument()
  })
})
