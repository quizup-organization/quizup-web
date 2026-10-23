// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics"
import { OnboardingFlow } from "./OnboardingFlow"

const follow = vi.hoisted(() => vi.fn())
const completeOnboarding = vi.hoisted(() => vi.fn())
const startMatchmaking = vi.hoisted(() => vi.fn())

vi.mock("@/features/topics", () => ({
  topicsService: { follow },
}))

vi.mock("@/features/matchmaking", () => ({
  useStartMatchmaking: () => ({ mutate: startMatchmaking, isPending: false }),
}))

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

vi.mock("../hooks/useCompleteOnboarding", () => ({
  useCompleteOnboarding: () => ({
    mutateAsync: completeOnboarding,
    isPending: false,
  }),
}))

vi.mock("@/lib/telemetry", () => ({ trackProductEvent: vi.fn() }))

const topics: TopicCard[] = [
  {
    topicId: "topic-1",
    names: { fr: "Histoire" },
    description: null,
    category: null,
    categoryLabel: null,
    emoji: "🏛️",
    color: "#f00",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED",
  },
  {
    topicId: "topic-2",
    names: { fr: "Sciences" },
    description: null,
    category: null,
    categoryLabel: null,
    emoji: "🔬",
    color: "#0f0",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED",
  },
  {
    topicId: "topic-3",
    names: { fr: "Cinéma" },
    description: null,
    category: null,
    categoryLabel: null,
    emoji: "🎬",
    color: "#00f",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED",
  },
]

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  follow.mockReset()
  follow.mockResolvedValue(undefined)
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
        <OnboardingFlow topics={topics} returnTo={returnTo} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function selectThreeTopics() {
  for (const label of ["Histoire", "Sciences", "Cinéma"]) {
    fireEvent.click(screen.getByRole("button", { name: label }))
  }
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }))
}

describe("OnboardingFlow", () => {
  it("suit les 3 sujets, enregistre le flag serveur puis lance le duel", async () => {
    renderFlow()
    selectThreeTopics()

    fireEvent.click(
      screen.getByRole("button", { name: "Lancer mon premier duel" })
    )

    await waitFor(() => {
      expect(follow).toHaveBeenCalledTimes(3)
      expect(completeOnboarding).toHaveBeenCalledTimes(1)
      expect(startMatchmaking).toHaveBeenCalledWith("topic-1")
    })
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
    selectThreeTopics()

    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }))

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1))
    expect(startMatchmaking).not.toHaveBeenCalled()
  })

  it("ne navigue pas si le flag serveur n'a pas pu être enregistré", async () => {
    completeOnboarding.mockRejectedValueOnce(new Error("offline"))
    renderFlow()
    selectThreeTopics()

    fireEvent.click(
      screen.getByRole("button", { name: "Lancer mon premier duel" })
    )

    await waitFor(() =>
      expect(
        screen.getByText("Impossible d'enregistrer ton onboarding. Réessaie.")
      ).toBeInTheDocument()
    )
    expect(startMatchmaking).not.toHaveBeenCalled()
  })
})
