import { PLATFORM_STATS } from "@/lib/platform-marketing"

// Despre page constants — easy to update with real data or API later

export const platformStats = [
  { label: "Utilizatori activi", value: PLATFORM_STATS.activeUsers, icon: "users" },
  { label: "Grile rezolvate", value: PLATFORM_STATS.quizCount, icon: "check" },
  { label: "Soluții video", value: `${PLATFORM_STATS.videoSolutions}`, icon: "play" },
  { label: "Testimoniale", value: PLATFORM_STATS.testimonials, icon: "clock" },
] as const

export const teamMembers = [
  {
    name: "Mițurcă Sebastian",
    role: "Co-fondator & Dezvoltator",
    badge: "Premiant Olimpiada Națională de Fizică",
    description:
      "Pasionat de fizică teoretică și programare, Sebastian a construit arhitectura platformei PLANCK și dezvoltă conținutul educațional cu rigurozitate olimpică.",
    image: "https://i.ibb.co/0RKyZ5jj/DSC02304.jpg",
  },
  {
    name: "Avram Marina",
    role: "Co-fondator & Content Creator",
    badge: "Premianta Concursuri Cercetare Științifică",
    description:
      "Specializată în cercetare și metodologii educaționale, Marina creează conținutul didactic și dezvoltă strategiile de învățare care fac PLANCK unic.",
    image: "https://i.ibb.co/JRktCngW/Whats-App-Image-2025-06-15-at-22-05-38-efacef2e.jpg",
  },
  {
    name: "Bercea Codrin",
    role: "Head of Software",
    badge: "Premiant Olimpiada Națională de Inteligență Artificială",
    description:
      "Cu viziune în AI și inginerie software, Codrin coordonează dezvoltarea tehnologiei din spatele platformei PLANCK și creează soluții educaționale intuitive și moderne.",
    image: "/team/codrin-bercea.jpeg",
  },
  {
    name: "Voluntar 1",
    role: "Voluntar PLANCK",
    badge: "Contribuitor",
    description:
      "Contribuie activ la dezvoltarea platformei și la crearea de conținut educațional de calitate pentru comunitatea PLANCK.",
    image: "/team/voluntar1.jpg",
  },
  {
    name: "Voluntar 2",
    role: "Voluntar PLANCK",
    badge: "Contribuitor",
    description:
      "Contribuie activ la dezvoltarea platformei și la crearea de conținut educațional de calitate pentru comunitatea PLANCK.",
    image: "/team/voluntar2.jpg",
  },
] as const
