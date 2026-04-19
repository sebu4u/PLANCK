import { User } from "lucide-react"

import { cn } from "@/lib/utils"

interface AuthorAvatarProps {
  name: string
  compact?: boolean
}

export function AuthorAvatar({ name, compact }: AuthorAvatarProps) {
  const initial = (name || "U").trim().charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-[#5b47d6] font-semibold text-white",
        compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      )}
    >
      <span>{initial}</span>
      <span
        className={cn(
          "absolute inline-flex items-center justify-center rounded-full bg-white text-[#5b47d6] shadow-sm",
          compact ? "-bottom-0.5 -right-0.5 h-3 w-3" : "-bottom-0.5 -right-0.5 h-4 w-4",
        )}
      >
        <User className={compact ? "h-2 w-2" : "h-2.5 w-2.5"} />
      </span>
    </div>
  )
}
