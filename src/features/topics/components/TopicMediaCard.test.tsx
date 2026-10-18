// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics/domain/topic"
import { TopicMediaCard } from "./TopicMediaCard"

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
  imageUrl: "https://example.com/cover.jpg",
  bannerUrl: "https://example.com/banner.jpg",
  followersCount: 12,
  questionsCount: 7,
  followed: false,
  status: "PUBLISHED",
}

describe("TopicMediaCard", () => {
  it("affiche le titre, la catégorie et le rang du Top 10 en format poster", () => {
    render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={3} />
    )

    const card = screen.getByRole("button", {
      name: "N° 3 — Breaking Bad",
    })
    expect(card).toHaveAttribute("data-format", "poster")
    expect(screen.getByText("Séries & TV")).toBeInTheDocument()
  })

  it("utilise la bannière en paysage, sans rang", () => {
    const { container } = render(
      <TopicMediaCard
        topic={TOPIC}
        onOpen={vi.fn()}
        format="landscape"
        rank={2}
      />
    )

    const card = screen.getByRole("button", { name: "Breaking Bad" })
    expect(card).toHaveAttribute("data-format", "landscape")
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/banner.jpg"
    )
    expect(
      container.querySelector('[data-slot="topic-card-media"]')
    ).toHaveClass("aspect-video")
    expect(screen.queryByText("2")).toBeNull()
  })

  it("conserve les ratios responsive du Top 10", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={3} />
    )

    const card = screen.getByRole("button", { name: "N° 3 — Breaking Bad" })
    expect(card).toHaveClass("compact:aspect-[3/5]")
    expect(
      container.querySelector('[data-slot="topic-card-media"]')
    ).toHaveClass("tablet-up:aspect-[2/3]")
  })

  it("affiche le rang 10 dans la gouttière du Top 10", () => {
    render(
      <TopicMediaCard
        topic={TOPIC}
        onOpen={vi.fn()}
        format="poster"
        rank={10}
      />
    )

    expect(
      screen.getByRole("button", { name: "N° 10 — Breaking Bad" })
    ).toBeInTheDocument()
  })

  it("utilise la couverture en poster", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" />
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg"
    )
  })

  it("ouvre le sujet au clic", () => {
    const onOpen = vi.fn()
    render(<TopicMediaCard topic={TOPIC} onOpen={onOpen} format="landscape" />)

    fireEvent.click(screen.getByRole("button", { name: "Breaking Bad" }))

    expect(onOpen).toHaveBeenCalledWith("topic-breaking-bad")
  })
})
