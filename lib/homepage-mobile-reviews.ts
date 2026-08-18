export type HomepageMobileReview = {
  id: string
  name: string
  /** 5 sau 4.5 */
  rating: 5 | 4.5
  quote: string
  /** Fișier în `public/reviews/` (ex. `/reviews/avatar-1.webp`) */
  avatarSrc: string
}

export const HOMEPAGE_MOBILE_REVIEWS: HomepageMobileReview[] = [
  {
    id: "1",
    name: "Elev, liceu",
    rating: 5,
    quote: "Pentru prima dată, fizica are sens.",
    avatarSrc: "/reviews/avatar-1.webp",
  },
  {
    id: "2",
    name: "Olimpiadă",
    rating: 5,
    quote: "Nivel de olimpiadă, explicat clar.",
    avatarSrc: "/reviews/avatar-2.webp",
  },
  {
    id: "3",
    name: "Clasa a XI-a",
    rating: 4.5,
    quote: "Simți că cineva gândește cu tine.",
    avatarSrc: "/reviews/avatar-3.webp",
  },
  {
    id: "4",
    name: "Faze superioare",
    rating: 5,
    quote: "Se vede că e construit de cineva care a trecut prin asta.",
    avatarSrc: "/reviews/avatar-5.webp",
  },
  {
    id: "5",
    name: "Profil real",
    rating: 4.5,
    quote: "Am câștigat claritate și încredere.",
    avatarSrc: "/reviews/avatar-5.webp",
  },
  {
    id: "6",
    name: "Elev PLANCK",
    rating: 5,
    quote: "În sfârșit înțeleg de ce funcționează formulele.",
    avatarSrc: "/reviews/avatar-6.webp",
  },
]
