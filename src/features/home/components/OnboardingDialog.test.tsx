// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics"
import { useOnboardingStore } from "../stores/useOnboardingStore"
import { OnboardingDialog } from "./OnboardingDialog"

const follow = vi.hoisted(() => vi.fn())
const startMatchmakingMutate = vi.hoisted(() => vi.fn())

vi.mock("@/features/topics", () => ({
  topicsService: { follow },
}))

vi.mock("@/features/matchmaking", () => ({
  useStartMatchmaking: () => ({
    mutate: startMatchmakingMutate,
    isPending: false,
  }),
}))

vi.mock("@/features/shell", () => ({
  useMe: () => ({
    data: { stats: { played: 0 }, language: "fr" },
    userId: "user-1",
  }),
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

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
  startMatchmakingMutate.mockReset()
  useOnboardingStore.setState({ completed: false })
})

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingDialog topics={topics} />
    </QueryClientProvider>
  )
}

describe("OnboardingDialog", () => {
  it("suit les 3 sujets puis lance le premier duel", async () => {
    renderDialog()

    expect(
      screen.getByText("Choisis 3 sujets pour commencer")
    ).toBeInTheDocument()

    for (const label of ["Histoire", "Sciences", "Cinéma"]) {
      fireEvent.click(screen.getByRole("button", { name: label }))
    }

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }))
    expect(screen.getByText("Comment tu progresses")).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "Lancer mon premier duel" })
    )

    await waitFor(() => {
      expect(follow).toHaveBeenCalledTimes(3)
      expect(startMatchmakingMutate).toHaveBeenCalledWith("topic-1")
      expect(useOnboardingStore.getState().completed).toBe(true)
    })
  })

  it("peut être passé sans lancer de duel", () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Passer" }))

    expect(useOnboardingStore.getState().completed).toBe(true)
    expect(startMatchmakingMutate).not.toHaveBeenCalled()
  })
})
