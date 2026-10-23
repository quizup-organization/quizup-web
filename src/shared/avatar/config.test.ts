import { describe, expect, it } from "vitest"
import {
  BASE_AVATAR_STYLE,
  DEFAULT_BASE_AVATAR_BACKGROUND,
  isBaseAvatarConfig,
  parseAvatarConfig,
  resolveBaseAvatarBackground,
} from "./config"

describe("avatar config", () => {
  it("parse l'avatar de base et son fond", () => {
    expect(
      parseAvatarConfig('{"style":"base","backgroundColor":"#dbeafe"}')
    ).toEqual({ style: BASE_AVATAR_STYLE, backgroundColor: "blue" })
    expect(parseAvatarConfig('{"style":"base"}')).toEqual({
      style: BASE_AVATAR_STYLE,
      backgroundColor: DEFAULT_BASE_AVATAR_BACKGROUND,
    })
  })

  it("parse les styles DiceBear historiques", () => {
    expect(parseAvatarConfig('{"style":"micah","hair":"full"}')).toEqual({
      style: "micah",
      hair: "full",
    })
    expect(parseAvatarConfig("{}")).toEqual({})
  })

  it("détecte l'avatar de base", () => {
    expect(isBaseAvatarConfig(parseAvatarConfig('{"style":"base"}'))).toBe(true)
    expect(isBaseAvatarConfig(parseAvatarConfig('{"style":"micah"}'))).toBe(
      false
    )
    expect(isBaseAvatarConfig(undefined)).toBe(false)
  })

  it("normalise une couleur legacy vers la palette", () => {
    expect(resolveBaseAvatarBackground("#DBEAFE").id).toBe("blue")
    expect(resolveBaseAvatarBackground("unknown").id).toBe("gray")
  })
})
