// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics/domain/topic"
import { TopicPosterCard } from "./TopicPosterCard"

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "",
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

const TOPIC: TopicCard = {
  topicId: "topic-breaking-bad",
  names: { fr: "Breaking Bad", en: "Breaking Bad" },
  description: null,
  category: "TELEVISION",
  categoryLabel: "Télévision",
  emoji: null,
  color: "#f59e0b",
  imageUrl: null,
  bannerUrl: null,
  followersCount: 12,
  questionsCount: 7,
  followed: false,
  status: "PUBLISHED",
}

describe("TopicPosterCard", () => {
  it("affiche le titre, la catégorie et le rang du Top 10", () => {
    render(<TopicPosterCard topic={TOPIC} onOpen={vi.fn()} rank={3} />)

    expect(
      screen.getByRole("button", { name: "N° 3 — Breaking Bad" })
    ).toBeInTheDocument()
    expect(screen.getByText("Séries & TV")).toBeInTheDocument()
  })

  it("n'affiche pas de rang hors section classée", () => {
    render(<TopicPosterCard topic={TOPIC} onOpen={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: "Breaking Bad" })
    ).toBeInTheDocument()
    expect(screen.queryByText(/^N°/)).toBeNull()
  })

  it("ouvre le sujet au clic", () => {
    const onOpen = vi.fn()
    render(<TopicPosterCard topic={TOPIC} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole("button", { name: "Breaking Bad" }))

    expect(onOpen).toHaveBeenCalledWith("topic-breaking-bad")
  })
})
