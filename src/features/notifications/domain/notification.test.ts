import { describe, expect, it } from "vitest";
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications";
import {
  isExpired,
  roomTargetPath,
  notificationTargetPath,
  notificationToast,
  relativeTime,
} from "./notification";

function notification(
  type: NotificationType,
  overrides: Partial<NotificationView> = {},
): NotificationView {
  return {
    notificationId: "n1",
    type,
    actorId: "u2",
    sourceId: null,
    topicId: null,
    gameId: null,
    expiresAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function challengeInvitation(expiresAt: string | null): NotificationView {
  return {
    notificationId: "n1",
    type: "CHALLENGE_RECEIVED",
    actorId: "u2",
    sourceId: "challenge-1",
    topicId: "topic-1",
    gameId: null,
    expiresAt,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
}

describe("roomTargetPath", () => {
  const accepted = (gameId: string | null, sourceId: string | null): NotificationView => ({
    notificationId: "n2",
    type: "ROOM_ACCEPTED",
    actorId: "u2",
    sourceId,
    topicId: "topic-1",
    gameId,
    expiresAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  });

  it("pointe vers l'arène quand la partie est créée", () => {
    expect(roomTargetPath(accepted("game-1", "room-1"))).toBe("/game/game-1");
  });

  it("pointe vers la salle d'attente sinon", () => {
    expect(roomTargetPath(accepted(null, "room-1"))).toBe("/rooms/room-1");
  });

  it("est nul pour les autres types", () => {
    expect(roomTargetPath(challengeInvitation(null))).toBeNull();
  });
});

describe("notificationTargetPath", () => {
  it("pointe vers le profil de l'abonné", () => {
    expect(notificationTargetPath(notification("FOLLOW"))).toBe("/players/u2");
    expect(notificationTargetPath(notification("FOLLOW", { actorId: null }))).toBeNull();
  });

  it("pointe vers l'arène ou la salle pour un défi accepté", () => {
    expect(
      notificationTargetPath(notification("ROOM_ACCEPTED", { gameId: "game-1" })),
    ).toBe("/game/game-1");
    expect(
      notificationTargetPath(notification("ROOM_ACCEPTED", { sourceId: "room-1" })),
    ).toBe("/rooms/room-1");
  });

  it("est nul pour une invitation (la ligne ré-affiche la modale)", () => {
    expect(
      notificationTargetPath(
        notification("CHALLENGE_RECEIVED", { sourceId: "challenge-1" }),
      ),
    ).toBeNull();
  });

  it("est nul pour les événements purement informatiques", () => {
    expect(notificationTargetPath(notification("CHALLENGE_DECLINED"))).toBeNull();
  });
});

describe("notificationToast", () => {
  it("propose l'abonné pour un follow", () => {
    expect(notificationToast(notification("FOLLOW"))).toEqual({
      title: "Nouvel abonné",
      description: "Un joueur s'est abonné à toi.",
      path: "/players/u2",
    });
  });

  it("pointe vers l'arène ou la salle pour un défi accepté", () => {
    expect(
      notificationToast(notification("ROOM_ACCEPTED", { gameId: "game-1" })),
    ).toEqual({
      title: "Ton défi a été accepté",
      description: "Touche pour rejoindre la salle.",
      path: "/game/game-1",
    });
  });

  it("ramène vers l'inbox pour un refus", () => {
    expect(notificationToast(notification("CHALLENGE_DECLINED"))?.path).toBe(
      "/notifications",
    );
  });

  it("écarte les invitations (modale dédiée)", () => {
    expect(notificationToast(notification("CHALLENGE_RECEIVED"))).toBeNull();
  });
});

describe("isExpired", () => {
  it("vrai quand la date d'expiration est passée", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isExpired(challengeInvitation(past))).toBe(true);
  });

  it("faux quand l'expiration est future ou absente", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isExpired(challengeInvitation(future))).toBe(false);
    expect(isExpired(challengeInvitation(null))).toBe(false);
  });
});

describe("relativeTime", () => {
  it("affiche « à l'instant » pour une date récente", () => {
    expect(relativeTime(new Date().toISOString())).toBe("à l'instant");
  });

  it("affiche les minutes puis les heures", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();

    expect(relativeTime(fiveMinutesAgo)).toBe("il y a 5 min");
    expect(relativeTime(threeHoursAgo)).toBe("il y a 3 h");
  });

  it("affiche les jours sur une semaine", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();

    expect(relativeTime(twoDaysAgo)).toBe("il y a 2 j");
  });
});
