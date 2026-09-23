/** Abonnement unidirectionnel d'un joueur à un autre (`followId = followerId:followedId`). */
export interface UserFollower {
  followId: string;
  followerId: string;
  followedId: string;
  followedAt: string;
}
