import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import Link from "next/link"
import { ArrowLeft, PlayCircle, BookOpen, ExternalLink, ChevronRight, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

function slugify(input: string): string {
    if (!input) return "";
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

const lessons = [
    "Ce este fizica?",
    "Sistem de referinta si traiectoria",
    "Miscarea rectilinie Uniforma",
    "Miscarea uniform Variata",
    "Miscarea sub actiunea greutatii",
    "Notiunea de forta",
    "Legile lui Newton",
    "Forta normala",
    "Forta de frecare",
    "Forta elastica si resortul",
    "Planul inclinat"
];

const youtubeSections = [
    {
        title: "Vectori și operații cu vectori",
        links: [
            { title: "Intro to Vectors & basic operations", url: "https://www.youtube.com/watch?v=JM3C1LftPBU" },
            { title: "Vectors — basic intro", url: "https://www.youtube.com/watch?v=EwSHKuSxX_8" },
            { title: "Vectors in Physics playlist", url: "https://www.youtube.com/playlist?list=PLbC_NLX1BD1ez2k95xhEpeCQDGaZ0ZqRY" }
        ]
    },
    {
        title: "MRU, MRUV și mișcări 2D",
        links: [
            { title: "Vectors & kinematics", url: "https://www.youtube.com/watch?v=jlD83a-bgQc" },
            { title: "Vectors & projectile motion tutorials", url: "https://www.youtube.com/playlist?list=PL3Fs-J5jNT53BS-Ct4X6Kzl0-vPSOY47x" }
        ]
    },
    {
        title: "Aruncarea punctului material",
        description: "Această parte este inclusă și în playlistul de mai sus (Vectors & projectile motion)."
    },
    {
        title: "Noțiuni și legi de dinamică",
        links: [
            { title: "Vectors & 2D motion (introducere miscari)", url: "https://www.youtube.com/watch?v=w3BhzYI6zXU" }
        ]
    }
];

// 30 random unique IDs between 001 and 090
const problemIds = [
    "M001", "M004", "M007", "M012", "M015", "M018", "M021", "M024", "M029", "M033",
    "M036", "M039", "M042", "M045", "M048", "M051", "M054", "M057", "M060", "M063",
    "M066", "M069", "M072", "M075", "M078", "M081", "M084", "M087", "M089", "M090"
];

export default function MaterialsPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <ConcursNavbar />

            <main className="pt-32 pb-16 px-4 sm:px-8 lg:px-16 max-w-5xl mx-auto">
                {/* Back Button Top */}
                <div className="mb-8">
                    <Link href="/concurs">
                        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                            Înapoi la concurs
                        </Button>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Materiale de Studiu
                    </h1>
                    <p className="text-xl text-gray-600 font-medium">
                        Resurse esențiale pentru clasa a IX-a
                    </p>
                </div>

                {/* Section 1: Cursuri */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Lectii Recomandate</h2>
                    </div>

                    <div className="grid gap-4">
                        {lessons.map((lesson, index) => (
                            <div key={index} className="group bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {index + 1}
                                    </span>
                                    <span className="font-semibold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">
                                        {lesson}
                                    </span>
                                </div>
                                <Link href={`/cursuri/${slugify(lesson)}`}>
                                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        Vezi Lecția <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 2: YouTube Resources */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                            <PlayCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Resurse Video (YouTube)</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {youtubeSections.map((section, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 h-full">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                    {section.title}
                                </h3>

                                {section.links ? (
                                    <ul className="space-y-3">
                                        {section.links.map((link, lIdx) => (
                                            <li key={lIdx}>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-2 text-gray-700 hover:text-red-600 transition-colors group"
                                                >
                                                    <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                                                    <span className="font-medium">{link.title}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">{section.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: Practice Problems */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                            <FileQuestion className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Probleme de Antrenament</h2>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Exersează cu această selecție de probleme pentru a te pregăti de concurs.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {problemIds.map((id) => (
                            <Link href={`/probleme/${id}`} key={id}>
                                <div className="bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl p-4 text-center transition-all duration-300 shadow-sm hover:shadow group cursor-pointer">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Problema
                                    </span>
                                    <span className="text-xl font-bold text-gray-900 group-hover:text-purple-700">
                                        {id}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Back Button Bottom */}
                <div className="mt-16 flex justify-center pt-8 border-t border-gray-100">
                    <Link href="/concurs">
                        <Button size="lg" className="gap-2 rounded-full">
                            <ArrowLeft className="w-4 h-4" />
                            Înapoi la concurs
                        </Button>
                    </Link>
                </div>
            </main>

            <footer className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-12 bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-gray-900">PLANCK</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="/termeni" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Termeni și Condiții
                            </Link>
                            <Link href="/confidentialitate" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Politica de Confidențialitate
                            </Link>
                            <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Contact
                            </Link>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
