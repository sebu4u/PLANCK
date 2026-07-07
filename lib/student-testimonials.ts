export type StudentTestimonial = {
  id: string
  quote: string
  name: string
  role: string
  rating: 4 | 4.5 | 5
}

export const STUDENT_TESTIMONIALS: StudentTestimonial[] = [
  {
    id: "student-1",
    quote:
      "La PLANCK nu am învățat formule pe de rost. Am înțeles de ce funcționează lucrurile și asta mi-a schimbat complet modul de a rezolva probleme.",
    name: "Alex M.",
    role: "Elev, liceu",
    rating: 5,
  },
  {
    id: "student-2",
    quote:
      "Explicațiile sunt extrem de bine structurate. Chiar și subiectele grele devin logice. Exact ce îți trebuie dacă vrei performanță.",
    name: "Maria P.",
    role: "Participantă la olimpiade",
    rating: 5,
  },
  {
    id: "student-3",
    quote:
      "AI-ul de pe PLANCK nu îți dă doar răspunsul. Te duce pas cu pas prin raționament, exact cum ar face un profesor bun.",
    name: "Andrei V.",
    role: "Elev clasa a XI-a",
    rating: 4.5,
  },
  {
    id: "student-4",
    quote:
      "Înainte mă blocam. Acum știu ce întrebări să-mi pun și cum să atac problema. Diferența e enormă.",
    name: "Ioana R.",
    role: "Elevă, profil real",
    rating: 5,
  },
]

export function getStudentTestimonialsCopy(): { title: string; subtitle: string } {
  return {
    title: "Elevi care au trecut la următorul nivel",
    subtitle:
      "Povești reale de la colegi care folosesc PLANCK zilnic — claritate, încredere și progres măsurabil.",
  }
}
