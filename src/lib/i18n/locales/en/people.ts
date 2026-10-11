import type { people as frPeople } from "../fr/people";

export const people: typeof frPeople = {
  tabs: {
    following: "Following ({{count}})",
    followers: "Followers ({{count}})",
  },
  searchPlaceholder: "Search a person…",
  sortSection: "Sort by",
  sortAria: "Sort people",
  countLabel: "person",
  sorts: {
    level: "Level",
    recent: "Recently added",
    alpha: "Alphabetical order",
  },
  retry: "Try again",
  error: "Could not load people",
  emptyFollowing: "You don't follow anyone yet",
  emptyFollowers: "No one follows you yet",
  emptyDescription:
    "Find players through search, then open their profile to follow them.",
  exploreTopics: "Browse topics",
  card: {
    level: "Level {{level}}",
    fallbackName: "Player",
  },
  presence: {
    online: "Online",
    recently: "Seen recently",
    offline: "Offline",
  },
};
