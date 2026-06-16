import type { LucideIcon } from "lucide-react"
import { Atom } from "lucide-react"

export type InvataSubjectId = "fizica"

export interface InvataSubjectConfig {
  id: InvataSubjectId
  label: string
  icon: LucideIcon
  href: string
}

/** Materii disponibile în hub — extinde lista când se adaugă noi trasee. */
export const INVATA_SUBJECTS: InvataSubjectConfig[] = [
  {
    id: "fizica",
    label: "Fizică",
    icon: Atom,
    href: "/invata/fizica",
  },
]
