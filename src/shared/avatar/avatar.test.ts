import { describe, expect, it } from "vitest";
import {
  avatarDataUri,
  defaultAvatarOptions,
  parseAvatarOptions,
  randomAvatarOptions,
  seedAvatarOptions,
} from "./avatar";

function svgOf(uri: string): string {
  return decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
}

function normalizeRadius(svg: string): string {
  return svg.replace(/rx="180" ry="180"/g, 'rx="0" ry="0"');
}

describe("avatar", () => {
    it("génère un data URI déterministe pour un même seed", () => {
        expect(avatarDataUri(undefined, 64, "user-1")).toBe(avatarDataUri(undefined, 64, "user-1"));
    });

    it("produit un avatar différent selon le seed", () => {
        expect(avatarDataUri(undefined, 64, "user-1")).not.toBe(avatarDataUri(undefined, 64, "user-2"));
    });

    it("defaultAvatarOptions est déterministe", () => {
        expect(defaultAvatarOptions("user-1")).toEqual(defaultAvatarOptions("user-1"));
    });

    it("randomAvatarOptions produit une config complète", () => {
        const options = randomAvatarOptions();
        expect(options.hair).toBeTruthy();
        expect(options.baseColor).toBeTruthy();
        expect(options.clothes).toBeTruthy();
    });

    it("parseAvatarOptions tolère l'absence et le contenu invalide", () => {
        expect(parseAvatarOptions(undefined)).toBeUndefined();
        expect(parseAvatarOptions(null)).toBeUndefined();
        expect(parseAvatarOptions("not json")).toBeUndefined();
        expect(parseAvatarOptions('{"hair":"full"}')).toEqual({ hair: "full" });
    });

    it("rend un SVG pour une config complète", () => {
        const uri = avatarDataUri(defaultAvatarOptions("user-1"), 64, "user-1");
        expect(uri.startsWith("data:image/svg+xml")).toBe(true);
    });

    it("seedAvatarOptions est déterministe", () => {
        expect(seedAvatarOptions("user-1")).toEqual(seedAvatarOptions("user-1"));
    });

    it("seedAvatarOptions reproduit l'avatar dérivé du seed", () => {
        for (const seed of ["user-1", "user-42", "player-xyz"]) {
            const withOptions = normalizeRadius(
                svgOf(avatarDataUri(seedAvatarOptions(seed), 64, seed)),
            );
            const seedDerived = normalizeRadius(
                svgOf(avatarDataUri(undefined, 64, seed)),
            );
            expect(withOptions).toBe(seedDerived);
        }
    });
});
