export type HomepageTestimonialCategory = "student" | "teacher" | "parent"

export type HomepageTestimonial = {
  id: string
  name: string
  role: string
  category: HomepageTestimonialCategory
  /** Placeholder path — înlocuiește cu imaginile tale în `public/images/homepage-testimonials/` */
  imageSrc: string
  quote: string
  score: number
}

export const HOMEPAGE_TESTIMONIALS: HomepageTestimonial[] = [
  {
    id: "student-1",
    name: "Elena Mărgineanu",
    role: "Elevă, clasa a XI-a",
    category: "student",
    imageSrc: "/images/homepage-testimonials/01.jpg",
    quote:
      "La PLANCK am înțeles pentru prima dată de ce funcționează formulele, nu doar cum să le aplic. Insight m-a ajutat să nu mă blochez când nu știu de unde să încep. Nota la fizică a urcat de la 7 la 9 în două luni.",
    score: 908,
  },
  {
    id: "teacher-1",
    name: "Prof. Ionescu Mihai",
    role: "Profesor de fizică, București",
    category: "teacher",
    imageSrc: "/images/homepage-testimonials/02.jpg",
    quote:
      "Recomand PLANCK elevilor care vor mai mult decât rezolvări mecanice. Structura traseelor și calitatea problemelor sunt la nivel de olimpiadă, dar explicată clar. Ca profesor, apreciez că platforma completează ce facem la clasă, nu o înlocuiește.",
    score: 833,
  },
  {
    id: "parent-1",
    name: "Ana Popescu",
    role: "Mama unui elev de clasa a X-a",
    category: "parent",
    imageSrc: "/images/homepage-testimonials/03.jpg",
    quote:
      "Fiul meu era frustrat de fizică și evita temele. După câteva săptămâni pe PLANCK, văd că se așează singur la studiu. Știu exact unde e în traseu și ce a rezolvat — pentru un părinte, transparența contează enorm.",
    score: 756,
  },
  {
    id: "student-2",
    name: "Andrei Stanciu",
    role: "Participant la olimpiada națională",
    category: "student",
    imageSrc: "/images/homepage-testimonials/04.jpg",
    quote:
      "Problemele de pe PLANCK sunt exact genul care te forțează să gândești, nu să memorezi. Soluțiile video și Insight m-au ajutat să calific la faza națională. E platforma pe care o folosesc zilnic înainte de concurs.",
    score: 945,
  },
  {
    id: "teacher-2",
    name: "Prof. Maria Dumitrescu",
    role: "Profesor de matematică, Cluj",
    category: "teacher",
    imageSrc: "/images/homepage-testimonials/05.jpg",
    quote:
      "Folosesc PLANCK cu elevii din clubul de performanță. Grilele și traseele sunt bine gradate, iar Insight oferă feedback personalizat când nu pot fi cu toți în același timp. Material verificat, fără erori tip tipărituri vechi.",
    score: 812,
  },
  {
    id: "parent-2",
    name: "Cristian Voicu",
    role: "Tatăl unei elevă de clasa a IX-a",
    category: "parent",
    imageSrc: "/images/homepage-testimonials/06.jpg",
    quote:
      "Am comparat mai multe platforme înainte să aleagă PLANCK. Diferența e că aici conținutul e serios, nu gamificat superficial. Fiica mea învață informatică și matematică — totul e într-un singur loc, cu progres clar.",
    score: 689,
  },
  {
    id: "student-3",
    name: "Maria Ionescu",
    role: "Elevă, profil real",
    category: "student",
    imageSrc: "/images/homepage-testimonials/07.jpg",
    quote:
      "Înainte mă temeam de BAC la fizică. Acum am un plan clar: ce capitole, ce grile, ce probleme video. Simt că am control, nu că plutesc. Insight e ca un profesor care nu se supără când întrebi aceeași chestie a treia oară.",
    score: 871,
  },
  {
    id: "teacher-3",
    name: "Prof. Radu Enache",
    role: "Profesor de informatică, Iași",
    category: "teacher",
    imageSrc: "/images/homepage-testimonials/08.jpg",
    quote:
      "Secțiunea de informatică e surprinzător de bine făcută — probleme de concurs, editor integrat, teste automate. Elevii pot practica independent, iar eu pot urmări progresul clasei. Un instrument pe care îl recomand colegilor.",
    score: 902,
  },
  {
    id: "parent-3",
    name: "Ioana Gheorghe",
    role: "Mama unui elev de clasa a XII-a",
    category: "parent",
    imageSrc: "/images/homepage-testimonials/09.jpg",
    quote:
      "În clasa a XII-a, presiunea pentru BAC e mare. PLANCK i-a dat fiului meu structură și încredere — nu promite miracole, dar progresul e vizibil. Apreciez că profesorii verifică materialul; nu vreau să plătesc pentru conținut dubios.",
    score: 798,
  },
  {
    id: "student-4",
    name: "David Marin",
    role: "Elev, clasa a X-a",
    category: "student",
    imageSrc: "/images/homepage-testimonials/10.jpg",
    quote:
      "PlanckPass și traseele mă motivează să revin zilnic. Nu e ca alte aplicații unde te plictisești după o săptămână. Problemele video sunt geniale — vezi exact cum gândește cineva care chiar știe fizică.",
    score: 924,
  },
  {
    id: "teacher-4",
    name: "Prof. Elena Vasile",
    role: "Profesor de biologie, Timișoara",
    category: "teacher",
    imageSrc: "/images/homepage-testimonials/11.jpg",
    quote:
      "Traseul de biologie e complet și aliniat cu programa. Elevii pot relua lecțiile interactive când au nevoie, iar grilele de verificare sunt utile pentru pregătirea testelor. Platformă matură, nu un experiment educațional.",
    score: 765,
  },
  {
    id: "parent-4",
    name: "Mihai Constantinescu",
    role: "Tatăl unui elev de clasa a XI-a",
    category: "parent",
    imageSrc: "/images/homepage-testimonials/12.jpg",
    quote:
      "Investiția în PLANCK a fost una dintre cele mai bune decizii pentru educația copilului nostru. Vedem progres real la clasă, nu doar pe platformă. Și Insight e un plus — răspunde la întrebări când noi nu mai știm să explicăm.",
    score: 841,
  },
]
