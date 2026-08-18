export type LandingHeroReview = {
  id: string
  quote: string
  rating: 5 | 4.5 | 4
  avatarSrc: string
}

export const LANDING_HERO_REVIEW_ROWS: LandingHeroReview[][] = [
  [
    {
      id: "r1-1",
      quote: "În sfârșit înțeleg fizica, nu doar formulele de pe tablă.",
      rating: 5,
      avatarSrc: "/reviews/avatar-1.webp",
    },
    {
      id: "r1-2",
      quote: "Pregătirile live m-au scos din blocaj înainte de test.",
      rating: 4.5,
      avatarSrc: "/reviews/avatar-2.webp",
    },
    {
      id: "r1-3",
      quote: "Simulările de BAC sunt exact ce aveam nevoie zilnic.",
      rating: 5,
      avatarSrc: "/reviews/avatar-3.webp",
    },
    {
      id: "r1-4",
      quote: "Un singur abonament, toate materiile — merită tot banul.",
      rating: 4,
      avatarSrc: "/reviews/avatar-5.webp",
    },
  ],
  [
    {
      id: "r2-1",
      quote: "Insight mă ghidează pas cu pas, fără să-mi dea răspunsul.",
      rating: 5,
      avatarSrc: "/reviews/avatar-6.webp",
    },
    {
      id: "r2-2",
      quote: "Profesorii olimpici explică pe limba noastră, clar și calm.",
      rating: 4.5,
      avatarSrc: "/reviews/avatar-1.webp",
    },
    {
      id: "r2-3",
      quote: "Grilele rezolvate video m-au salvat la chimie și mate.",
      rating: 5,
      avatarSrc: "/reviews/avatar-2.webp",
    },
    {
      id: "r2-4",
      quote: "Revin zilnic, e ca o meditație fără stres și fără grabă.",
      rating: 4,
      avatarSrc: "/reviews/avatar-3.webp",
    },
  ],
  [
    {
      id: "r3-1",
      quote: "De la 7 lei pe meditație, nu am găsit nimic mai bun.",
      rating: 5,
      avatarSrc: "/reviews/avatar-5.webp",
    },
    {
      id: "r3-2",
      quote: "Înregistrările mă ajută când ratez ora live de seara.",
      rating: 4.5,
      avatarSrc: "/reviews/avatar-6.webp",
    },
    {
      id: "r3-3",
      quote: "Nota la mate a urcat vizibil după două săptămâni aici.",
      rating: 5,
      avatarSrc: "/reviews/avatar-1.webp",
    },
    {
      id: "r3-4",
      quote: "Platforma e serioasă, nu gamificare goală și fără fond.",
      rating: 4,
      avatarSrc: "/reviews/avatar-2.webp",
    },
  ],
]
