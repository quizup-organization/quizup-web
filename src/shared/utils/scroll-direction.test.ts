import { describe, expect, it } from "vitest";
import { nextHeaderHidden } from "./scroll-direction";

describe("nextHeaderHidden", () => {
  it("reste visible en haut de page même en descendant", () => {
    expect(nextHeaderHidden(true, { scrollTop: 0, delta: 12 })).toBe(false);
    expect(nextHeaderHidden(true, { scrollTop: 8, delta: 12 })).toBe(false);
  });

  it("se cache en descendant après le seuil", () => {
    expect(nextHeaderHidden(false, { scrollTop: 120, delta: 20 })).toBe(true);
    expect(nextHeaderHidden(false, { scrollTop: 40, delta: 20 })).toBe(false);
  });

  it("se révèle dès que l'on remonte", () => {
    expect(nextHeaderHidden(true, { scrollTop: 600, delta: -6 })).toBe(false);
  });

  it("conserve l'état sous le seuil de direction (hystérésis)", () => {
    expect(nextHeaderHidden(true, { scrollTop: 600, delta: 2 })).toBe(true);
    expect(nextHeaderHidden(false, { scrollTop: 600, delta: -2 })).toBe(false);
  });
});
