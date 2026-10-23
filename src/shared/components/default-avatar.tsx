import { UserRound } from "lucide-react"
import { cn } from "cn"
import {
  baseAvatarBackground,
  resolveBaseAvatarBackground,
  type BaseAvatarOptions,
} from "@/shared/avatar/config"

interface DefaultAvatarProps {
  backgroundColor?: string
  className?: string
  iconClassName?: string
}

/** Avatar générique (non Premium) : silhouette Lucide pleine sur fond coloré. */
export function DefaultAvatar({
  backgroundColor = "gray",
  className,
  iconClassName,
}: DefaultAvatarProps) {
  const background = resolveBaseAvatarBackground(backgroundColor)
  return (
    <span
      className={cn(
        "grid size-full place-items-center rounded-full",
        "bg-[var(--avatar-bg-light)] text-[#1a73e8]",
        "dark:bg-[var(--avatar-bg-dark)] dark:text-[#93c5fd]",
        className
      )}
      style={
        {
          "--avatar-bg-light": background.light,
          "--avatar-bg-dark": background.dark,
        } as React.CSSProperties
      }
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
