/**
 * Ids déterministes des agrégats de suivi — **miroir strict** de `FollowerIds` côté backend
 * (`quizup-social-domain`). Le read model est identifié par ces ids ; ils permettent de lire un
 * suivi par id (`GET /{followId}`) sans recherche filtrée.
 */
export const topicFollowId = (userId: string, topicId: string): string =>
  `${userId}:${topicId}`;

export const userFollowId = (followerId: string, followedId: string): string =>
  `${followerId}:${followedId}`;
