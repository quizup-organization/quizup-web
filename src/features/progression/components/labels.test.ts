import { describe, expect, it } from "vitest"
import { BADGE_FAMILIES, BADGE_TIERS } from "../domain/progression"
import {
  FAMILY_KEYS,
  METRIC_ACTION_KEYS,
  ONE_SHOT_CONDITION_KEYS,
} from "./labels"

describe("FAMILY_KEYS", () => {
  it("traduit chaque famille, VICTORY incluse", () => {
    for (const family of BADGE_FAMILIES) {
      expect(FAMILY_KEYS[family], family).toBeDefined()
    }
    expect(Object.keys(FAMILY_KEYS)).toHaveLength(BADGE_FAMILIES.length)
  })
})

describe("ONE_SHOT_CONDITION_KEYS", () => {
  it("explique chaque exploit ponctuel (jamais la phrase de métrique)", () => {
    expect(ONE_SHOT_CONDITION_KEYS).toEqual({
      FIRST_WIN: "progression.badgeCondition.FIRST_WIN",
      LIGHTNING: "progression.badgeCondition.LIGHTNING",
      PERFECT: "progression.badgeCondition.PERFECT",
      STREAK_MASTER: "progression.badgeCondition.STREAK_MASTER",
    })
    // La phrase générique de l'exploit reste le repli pour un code inconnu.
    expect(METRIC_ACTION_KEYS.ONE_SHOT).toBe(
      "progression.metricAction.ONE_SHOT"
    )
  })
})

describe("palette des paliers", () => {
  it("n'utilise jamais deux fois la même teinte", async () => {
    const { TIER_COLORS } = await import("../domain/progression")
    const fills = BADGE_TIERS.map((tier) => TIER_COLORS[tier].fill)
    expect(new Set(fills).size).toBe(fills.length)
  })
})
