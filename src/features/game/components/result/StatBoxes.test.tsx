// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type { GameResultView } from "../../domain/game-dto"
import { StatBoxes } from "./StatBoxes"

const result: GameResultView = {
  myScore: 120,
  opponentScore: 90,
  winnerId: "user-1",
  botGame: false,
  basePoints: 100,
  speedBonus: 20,
  correctAnswers: 6,
  fastAnswers: 3,
  answeredRounds: 7,
  totalRounds: 7,
  reward: { xp: 150, victoryBonus: 50 },
  progression: {
    xpTotal: 250,
    level: 2,
    title: "Apprenti",
    xpForNextLevel: 400,
    levelProgressPercent: 62,
  },
  opponentLevel: 3,
  opponentTitle: "Apprenti",
  topic: {
    topicId: "topic-1",
    names: { fr: "Histoire" },
    category: null,
    emoji: null,
    color: null,
    imageUrl: null,
    titles: null,
  },
  opponent: null,
  opponentId: "player-2",
  botDifficulty: null,
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("StatBoxes", () => {
  it("duel entre joueurs : bonus victoire et XP totale", () => {
    render(<StatBoxes result={result} reward={result.reward} yourScore={120} />)

    expect(screen.getByText("BONUS VICTOIRE")).toBeInTheDocument()
    expect(screen.getByText("+50")).toBeInTheDocument()
    expect(screen.getByText("XP TOTALE")).toBeInTheDocument()
    expect(screen.queryByText("BONNES RÉPONSES")).not.toBeInTheDocument()
  })

  it("entraînement (duel bot) : pas d'XP, les bonnes réponses prennent la place", () => {
    render(
      <StatBoxes
        result={{
          ...result,
          botGame: true,
          reward: { xp: 0, victoryBonus: 0 },
        }}
        reward={{ xp: 0, victoryBonus: 0 }}
        yourScore={120}
        training
      />
    )

    expect(screen.queryByText("XP TOTALE")).not.toBeInTheDocument()
    expect(screen.queryByText("BONUS VICTOIRE")).not.toBeInTheDocument()
    expect(screen.getByText("BONNES RÉPONSES")).toBeInTheDocument()
    expect(screen.getByText("6/7")).toBeInTheDocument()
  })
})
