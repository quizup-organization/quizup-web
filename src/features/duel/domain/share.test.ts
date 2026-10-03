import { describe, expect, it } from "vitest";
import { shareMessage, shareTargets } from "./share";

const URL = "https://app.quizup.test/join/lobby-1";

describe("shareTargets", () => {
  it("construit les intents des quatre réseaux avec l'URL encodée", () => {
    const targets = shareTargets("Rejoins mon duel !", URL);

    expect(targets.map((target) => target.id)).toEqual([
      "whatsapp",
      "x",
      "facebook",
      "telegram",
    ]);
    for (const target of targets) {
      expect(target.href).toContain(encodeURIComponent(URL));
    }
  });

  it("ajoute le message sur WhatsApp, X et Telegram", () => {
    const targets = shareTargets("Rejoins mon duel !", URL);
    const text = encodeURIComponent("Rejoins mon duel !");

    expect(targets.find((target) => target.id === "whatsapp")?.href).toContain(text);
    expect(targets.find((target) => target.id === "x")?.href).toContain(text);
    expect(targets.find((target) => target.id === "telegram")?.href).toContain(text);
    expect(targets.find((target) => target.id === "facebook")?.href).not.toContain(text);
  });
});

describe("shareMessage", () => {
  it("cite le sujet quand il est connu", () => {
    expect(shareMessage("Cinéma")).toContain("« Cinéma »");
    expect(shareMessage()).not.toContain("«");
  });
});
