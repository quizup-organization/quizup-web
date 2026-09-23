import { describe, expect, it } from "vitest";
import { avatarDataUri, defaultAvatarOptions, parseAvatarOptions, randomAvatarOptions } from "./avatar";

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
});
