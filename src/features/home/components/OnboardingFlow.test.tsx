// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics"
import { OnboardingFlow } from "./OnboardingFlow"

const list = vi.hoisted(() => vi.fn())
const follow = vi.hoisted(() => vi.fn())
const completeOnboarding = vi.hoisted(() => vi.fn())
const startMatchmaking = vi.hoisted(() => vi.fn())

const categoryFacets = [
  { category: "HISTORY", label: "Histoire", count: 2 },
  { category: "SCIENCE", label: "Sciences", count: 2 },
  { category: "MOVIES", label: "Cinéma", count: 2 },
  { category: "SPORTS", label: "Sport", count: 1 },
]

vi.mock("@/features/topics", () => ({
  topicsService: { list, follow },
  useTopicCategories: () => ({
    data: categoryFacets.map(({ category, label }) => ({ category, label })),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useTopicFacets: () => ({
    data: { total: 7, categories: categoryFacets },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock("@/features/matchmaking", () => ({
  useStartMatchmaking: () => ({ mutate: startMatchmaking, isPending: false }),
}))

vi.mock("../hooks/useCompleteOnboarding", () => ({
  useCompleteOnboarding: () => ({
    mutateAsync: completeOnboarding,
    isPending: false,
  }),
}))

vi.mock("@/lib/telemetry", () => ({ trackProductEvent: vi.fn() }))

function topic(topicId: string, category: string): TopicCard {
  return {
    topicId,
    names: { fr: topicId },
    description: null,
    category,
    categoryLabel: null,
    emoji: "📚",
    color: "#f00",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED",
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  list.mockReset()
  list.mockImplementation(({ category }: { category?: string }) =>
    Promise.resolve({
      content: [topic(`topic-${category}`, category ?? "")],
      page: 0,
      size: 100,
      total: 1,
      last: true,
      first: true,
    })
  )
  follow.mockReset()
  completeOnboarding.mockReset()
  completeOnboarding.mockResolvedValue({})
  startMatchmaking.mockReset()
})

function renderFlow(returnTo?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingFlow returnTo={returnTo} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function selectCategories(labels: string[]) {
  for (const label of labels) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }))
  }
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }))
}

async function launch() {
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Lancer mon premier duel" })
    ).toBeEnabled()
  )
  fireEvent.click(
    screen.getByRole("button", { name: "Lancer mon premier duel" })
  )
}

describe("OnboardingFlow", () => {
  it("choisit des catégories, tire un sujet au hasard puis lance le duel", async () => {
    renderFlow()
    selectCategories(["Histoire", "Sciences", "Cinéma"])
    await launch()

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledTimes(1)
      expect(startMatchmaking).toHaveBeenCalledWith(
        expect.stringMatching(/^topic-(HISTORY|SCIENCE|MOVIES)$/)
      )
    })
    expect(follow).not.toHaveBeenCalled()
  })

  it("limite la sélection à 3 catégories", () => {
    renderFlow()
    for (const label of ["Histoire", "Sciences", "Cinéma", "Sport"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }))
    }

    expect(screen.getByText("3 / 3 catégories")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sport/ })).toBeDisabled()
  })

  it("peut être passé sans lancer de duel", async () => {
    renderFlow()
    fireEvent.click(screen.getByRole("button", { name: "Passer" }))

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1))
    expect(startMatchmaking).not.toHaveBeenCalled()
    expect(follow).not.toHaveBeenCalled()
  })

  it("rejoint la salle en priorité quand une invitation est en attente", async () => {
    renderFlow("/join/room-1")
    selectCategories(["Histoire"])

    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }))

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1))
    expect(startMatchmaking).not.toHaveBeenCalled()
  })

  it("ne navigue pas si le flag serveur n'a pas pu être enregistré", async () => {
    completeOnboarding.mockRejectedValueOnce(new Error("offline"))
    renderFlow()
    selectCategories(["Histoire"])
    await launch()

    await waitFor(() =>
      expect(
        screen.getByText("Impossible d'enregistrer ton onboarding. Réessaie.")
      ).toBeInTheDocument()
    )
    expect(startMatchmaking).not.toHaveBeenCalled()
  })
})
