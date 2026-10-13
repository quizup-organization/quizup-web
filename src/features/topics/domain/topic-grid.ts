export function compactTopicGridClass(columns: 3 | 4): string {
  return columns === 3
    ? "grid grid-cols-3 gap-x-1 gap-y-2"
    : "grid grid-cols-4 gap-x-1 gap-y-2"
}
