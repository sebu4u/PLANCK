import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import Link from "next/link"
import { ArrowLeft, BookOpen, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MaterialsXIIPage() {
    const previousGrades = [
        {
            grade: "Clasa a IX-a",
            link: "/concurs/materialeIX",
            description: "Mecanică, Optică Geometrică și altele",
            color: "text-orange-600",
            bg: "bg-orange-100",
            border: "hover:border-orange-300"
        },
        {
            grade: "Clasa a X-a",
            link: "/concurs/materialeX",
            description: "Termodinamică, Electricitate și Magnetism",
            color: "text-blue-600",
            bg: "bg-blue-100",
            border: "hover:border-blue-300"
        },
        {
            grade: "Clasa a XI-a",
            link: "/concurs/materialeXI",
            description: "Oscilații și Unde Mecanice",
            color: "text-purple-600",
            bg: "bg-purple-100",
            border: "hover:border-purple-300"
        }
    ]

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
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Materiale de Studiu - Clasa a XII-a
                    </h1>

                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <Layers className="w-8 h-8" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Materie Cumulativă
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Conform regulamentului, pentru clasa a XII-a <strong>intră toată materia claselor anterioare</strong> (IX, X, XI).
                            <br />
                            Vă recomandăm să parcurgeți materialele de pregătire de la clasele respective pentru a vă asigura că stăpâniți toate conceptele necesare.
                        </p>
                    </div>
                </div>

                {/* Links to Previous Grades */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Accesează materialele claselor anterioare</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {previousGrades.map((item, idx) => (
                            <Link href={item.link} key={idx} className="block h-full">
                                <div className={`h-full bg-white border border-gray-200 ${item.border} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col items-center text-center`}>
                                    <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 ${item.color} font-bold text-xl group-hover:scale-110 transition-transform`}>
                                        {['IX', 'X', 'XI'][idx]}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                                        {item.grade}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-6 flex-grow">
                                        {item.description}
                                    </p>

                                    <Button variant="outline" className="w-full group-hover:bg-gray-50">
                                        Vezi Resurse
                                    </Button>
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
