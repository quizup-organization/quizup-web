import type { notifications as frNotifications } from "../fr/notifications"

export const notifications: typeof frNotifications = {
  bell: {
    aria: "Notifications",
    markAll: "Mark all read",
    empty: "No notifications yet.",
    viewAll: "View all notifications",
  },
  list: {
    aria: "Notifications",
  },
  row: {
    follow: "{{name}} followed you.",
    challengeReceived: "{{name}} challenges you!",
    challengeDeclined: "{{name}} declined your challenge.",
    roomAccepted: "{{name}} accepted your challenge.",
    fallback: "Notification",
    viewProfile: "View {{name}}'s profile",
    unread: "Unread",
  },
  actions: {
    markRead: "Mark as read",
    markUnread: "Mark as unread",
    delete: "Delete",
    accept: "Accept",
    refuse: "Decline",
  },
  time: {
    justNow: "just now",
    minutes: "{{count}} min ago",
    hours: "{{count}} h ago",
    days: "{{count}} d ago",
  },
  toast: {
    followTitle: "New follower",
    followDescription: "A player followed you.",
    declinedTitle: "Challenge declined",
    declinedDescription: "Your opponent declined your challenge.",
    acceptedTitle: "Your challenge was accepted",
    acceptedDescription: "Tap to join the room.",
  },
  invitation: {
    title: "Challenge received",
    rematchTitle: "Rematch",
    playerFallback: "A player",
    topicFallback: "a topic",
    rematchOn: "wants a rematch on",
    challengesOn: "is challenging you on",
  },
  challenge: {
    goneTitle: "This challenge is no longer available",
    goneDescription: "It was cancelled or already resolved.",
  },
  presence: {
    playerFallback: "A player",
    online: "{{name}} is online",
  },
  push: {
    label: "Push notifications",
    unsupportedIos:
      "On iPhone/iPad: first install QuizUp on your Home Screen (iOS 16.4+) to enable notifications.",
    unsupported: "Your browser does not support push notifications.",
    denied:
      "Permission denied — allow notifications for this site in your browser.",
    subscribed:
      "Your challenges and follows arrive even when QuizUp is closed.",
    unsubscribed: "Get your challenges and follows even when QuizUp is closed.",
    enableError: "Could not enable push notifications.",
    disableError: "Could not disable push notifications.",
  },
  page: {
    filterAll: "All",
    filterUnread: "Unread",
    markAll: "Mark all read",
    deleteAll: "Delete all",
    loadError: "Could not load notifications.",
    emptyUnreadTitle: "No unread notifications",
    emptyTitle: "No notifications",
    emptyDescription:
      "Challenge a player from their profile or a topic: their acceptance and outcomes will land here.",
    previous: "Previous",
    next: "Next",
    pageIndicator: "Page {{page}} / {{totalPages}}",
    deleteAllTitle: "Delete all?",
    deleteAllDescription:
      "All notifications in your inbox will be permanently deleted. This action cannot be undone.",
  },
}
