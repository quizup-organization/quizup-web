import { afterEach, describe, expect, it, vi } from "vitest";
import { isFirefox, isIos, isStandalone } from "./pwa";

describe("pwa", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isStandalone est faux hors navigateur (node)", () => {
    expect(isStandalone()).toBe(false);
  });

  it("détecte Firefox (desktop)", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
    });

    expect(isFirefox()).toBe(true);
    expect(isIos()).toBe(false);
  });

  it("détecte iOS", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
    });

    expect(isIos()).toBe(true);
  });

  it("ne confond pas Chrome avec Firefox", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
    });

    expect(isFirefox()).toBe(false);
  });
});
