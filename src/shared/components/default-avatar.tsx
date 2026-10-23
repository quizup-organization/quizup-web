import { UserRound } from "lucide-react"
import { cn } from "cn"
import {
  baseAvatarBackground,
  baseAvatarForeground,
  DEFAULT_BASE_AVATAR_BACKGROUND,
  type BaseAvatarOptions,
} from "@/shared/avatar/config"

interface DefaultAvatarProps {
  backgroundColor?: string
  className?: string
  iconClassName?: string
}

/** Avatar générique (non Premium) : silhouette Lucide pleine sur fond coloré. */
export function DefaultAvatar({
  backgroundColor = DEFAULT_BASE_AVATAR_BACKGROUND,
  className,
  iconClassName,
}: DefaultAvatarProps) {
  const background = backgroundColor || DEFAULT_BASE_AVATAR_BACKGROUND
  return (
    <span
      className={cn(
        "grid size-full place-items-center rounded-full",
        className
      )}
      style={{
        backgroundColor: background,
        color: baseAvatarForeground(background),
      }}
    >
      <UserRound
        aria-hidden
        className={cn("size-[52%]", iconClassName)}
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  )
}

export function DefaultAvatarFromConfig({
  config,
  className,
  iconClassName,
}: {
  config?: BaseAvatarOptions
  className?: string
  iconClassName?: string
}) {
  return (
    <DefaultAvatar
      backgroundColor={config ? baseAvatarBackground(config) : undefined}
      className={className}
      iconClassName={iconClassName}
    />
  )
}
