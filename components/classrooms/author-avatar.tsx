import { User } from "lucide-react"

interface AuthorAvatarProps {
  name: string
}

export function AuthorAvatar({ name }: AuthorAvatarProps) {
  const initial = (name || "U").trim().charAt(0).toUpperCase()

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5b47d6] text-sm font-semibold text-white">
      <span>{initial}</span>
      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#5b47d6] shadow-sm">
        <User className="h-2.5 w-2.5" />
      </span>
    </div>
  )
}
