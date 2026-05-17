import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export const adminFieldClass = "bg-black/40 border-white/20 text-gray-100"
export const adminLabelClass = "text-xs text-gray-300"

export function AdminFieldLabel({ children }: { children: ReactNode }) {
  return <p className={adminLabelClass}>{children}</p>
}

export function AdminTextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(adminFieldClass, props.className)} />
}

export function AdminTextarea(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn(adminFieldClass, "font-mono text-sm", props.className)} />
}
