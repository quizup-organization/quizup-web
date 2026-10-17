// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TopicIcon } from "./topic-icon"

describe("TopicIcon", () => {
  it("pose un fond blanc derrière une image de sujet (transparence lisible)", () => {
    const { container } = render(
      <TopicIcon
        topic={{
          emoji: null,
          color: "#ff0000",
          imageUrl: "https://example.com/topic.png",
        }}
      />
    )

    expect(container.firstElementChild).toHaveStyle({
      backgroundColor: "#ffffff",
    })
  })

  it("garde la couleur éditoriale quand le sujet n'a pas d'image", () => {
    const { container } = render(
      <TopicIcon topic={{ emoji: "🧠", color: "#ff0000", imageUrl: null }} />
    )

    expect(container.firstElementChild).toHaveStyle({
      backgroundColor: "#ff0000",
    })
  })
})
