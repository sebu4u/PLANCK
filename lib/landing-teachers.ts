import type { WorkshopSubject } from "@/lib/pregatire/types"

export type LandingTeacher = {
  id: string
  name: string
  instagram: string
  description: string
  subject: WorkshopSubject
  /** Optional photo in `public/images/landing-teachers/`. Omit until the file exists. */
  imageSrc?: string
}

export const LANDING_TEACHERS: LandingTeacher[] = [
  {
    id: "teacher-1",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "fizica",
  },
  {
    id: "teacher-2",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "mate",
  },
  {
    id: "teacher-3",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "info",
  },
  {
    id: "teacher-4",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "chimie",
  },
  {
    id: "teacher-5",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "biologie",
  },
  {
    id: "teacher-6",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "fizica",
  },
  {
    id: "teacher-7",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "mate",
  },
  {
    id: "teacher-8",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "info",
  },
  {
    id: "teacher-9",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "chimie",
  },
  {
    id: "teacher-10",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "biologie",
  },
  {
    id: "teacher-11",
    name: "Nume Prenume",
    instagram: "@instagram",
    description: "Adaugă aici descrierea profesorului.",
    subject: "fizica",
  },
]
