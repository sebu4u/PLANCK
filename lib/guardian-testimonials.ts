import type { GuardianRole } from "@/lib/guardian-onboarding"

export type GuardianTestimonial = {
  id: string
  quote: string
  name: string
  role: string
  rating: 4 | 4.5 | 5
}

const PARENT_TESTIMONIALS: GuardianTestimonial[] = [
  {
    id: "parent-1",
    quote:
      "Fiul meu nu voia să audă de fizică. Acum intră singur pe platformă în fiecare seară și îmi povestește ce a înțeles.",
    name: "Elena D.",
    role: "Părinte",
    rating: 5,
  },
  {
    id: "parent-2",
    quote:
      "Văd clar progresul ei și știu unde are nevoie de ajutor. Nu mai simt că învățatul e un mister.",
    name: "Andreea M.",
    role: "Părinte",
    rating: 5,
  },
  {
    id: "parent-3",
    quote:
      "Recomandările zilnice sunt realiste — 30 de minute pe zi chiar funcționează pentru noi.",
    name: "Cristian P.",
    role: "Părinte",
    rating: 4.5,
  },
]

const TEACHER_TESTIMONIALS: GuardianTestimonial[] = [
  {
    id: "teacher-1",
    quote:
      "Catalogul de probleme video îmi economisește ore. Arăt elevilor explicații clare, verificate pas cu pas.",
    name: "Prof. Radu I.",
    role: "Profesor de fizică",
    rating: 5,
  },
  {
    id: "teacher-2",
    quote:
      "Pot urmări progresul clasei și văd exact unde trebuie să revin cu recapitulări.",
    name: "Prof. Ioana S.",
    role: "Profesor de matematică",
    rating: 5,
  },
  {
    id: "teacher-3",
    quote:
      "Elevii folosesc Insight acasă, iar la clasă discutăm conceptele — nu doar rezolvările mecanice.",
    name: "Prof. Mihai T.",
    role: "Profesor de informatică",
    rating: 4.5,
  },
]

export function getGuardianTestimonials(role: GuardianRole): GuardianTestimonial[] {
  return role === "profesor" ? TEACHER_TESTIMONIALS : PARENT_TESTIMONIALS
}

export function getGuardianTestimonialsCopy(role: GuardianRole): { title: string; subtitle: string } {
  if (role === "profesor") {
    return {
      title: "Profesori care predau cu PLANCK",
      subtitle:
        "Colegi care folosesc platforma în clasă și acasă — pentru lecții mai clare și progres vizibil.",
    }
  }

  return {
    title: "Părinți care susțin progresul",
    subtitle:
      "Familii care folosesc PLANCK ca să urmărească ritmul copilului — fără presiune, cu rezultate reale.",
  }
}
