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
    expect(card).toHaveClass("border", "border-border")
    expect(screen.queryByText("2")).toBeNull()
  })

  it("conserve le ratio 3:5, le pied intégré et la bordure du Top 10", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={3} />
    )

    const card = screen.getByRole("button", { name: "N° 3 — Breaking Bad" })
    expect(card).toHaveClass("aspect-[3/5]", "border", "border-border")
    expect(
      container.querySelector('[data-slot="topic-card-media"]')
    ).toHaveClass("flex-1")
    expect(
      container.querySelector('[data-slot="topic-card-footer"]')
    ).toHaveClass("h-20", "bg-muted")
    expect(container.querySelector('[data-slot="topic-rank"]')).toHaveClass(
      "text-[68cqw]"
    )
  })

  it("affiche le rang 10 à la même taille que les autres rangs", () => {
    const { container } = render(
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
    const rank = container.querySelector('[data-slot="topic-rank"]')
    expect(rank).toHaveClass("text-[68cqw]", "-left-20")
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
