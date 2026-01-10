"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FadeInUp } from "@/components/scroll-animations"
import { BookOpen, Sparkles, Brain, CheckCircle, Play, GraduationCap, Clock, Users, MessageCircle, Award, Zap } from "lucide-react"

const features = [
    {
        icon: BookOpen,
        title: "Cursuri complete",
        description: "De la mecanică la fizică cuantică, toate capitolele explicate clar"
    },
    {
        icon: Sparkles,
        title: "Asistent AI",
        description: "Pune întrebări și primește răspunsuri instant, 24/7"
    },
    {
        icon: Brain,
        title: "Învățare adaptivă",
        description: "Conținutul se adaptează la ritmul și stilul tău de învățare"
    },
    {
        icon: CheckCircle,
        title: "Progres salvat",
        description: "Continuă de unde ai rămas, oricând și de pe orice dispozitiv"
    }
]

export function CoursesSectionHomepage() {
    return (
        <section
            className="w-full min-h-screen flex items-center py-24 lg:py-32"
            style={{ backgroundColor: '#111111' }}
        >
            <div className="max-w-[1400px] mx-auto px-6 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left Column: Video/Image Preview */}
                    <FadeInUp className="order-2 lg:order-1">
                        <div className="relative group">
                            {/* Glow effect behind the card */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Main card container */}
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
                                {/* Course preview image/mockup */}
                                <div className="aspect-video relative bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                                    {/* Decorative elements to simulate course UI */}
                                    <div className="absolute inset-0 p-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                                <Play className="w-5 h-5 text-white fill-white" />
                                            </div>
                                            <div>
                                                <div className="h-3 w-32 bg-white/80 rounded-full mb-2" />
                                                <div className="h-2 w-20 bg-white/40 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Content blocks */}
                                        <div className="space-y-4">
                                            <div className="h-20 bg-white/5 rounded-xl border border-white/10 p-4">
                                                <div className="h-2 w-3/4 bg-white/30 rounded-full mb-2" />
                                                <div className="h-2 w-1/2 bg-white/20 rounded-full mb-3" />
                                                <div className="flex gap-2">
                                                    <div className="h-6 w-16 bg-purple-500/30 rounded-md" />
                                                    <div className="h-6 w-20 bg-blue-500/30 rounded-md" />
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1 h-16 bg-white/5 rounded-xl border border-white/10" />
                                                <div className="flex-1 h-16 bg-white/5 rounded-xl border border-white/10" />
                                            </div>
                                        </div>

                                        {/* AI Chat bubble */}
                                        <div className="absolute bottom-6 right-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 max-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs text-white/60">AI Assistant</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/30 rounded-full mb-1" />
                                            <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
                                </div>

                                {/* Bottom info bar */}
                                <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-[#1a1a1a]" />
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#1a1a1a]" />
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-[#1a1a1a]" />
                                        </div>
                                        <span className="text-xs text-gray-400">+1,200 elevi activi</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeInUp>

                    {/* Right Column: Text Content */}
                    <div className="order-1 lg:order-2">
                        <FadeInUp>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                                <BookOpen className="w-4 h-4" />
                                Cursuri Interactive
                            </span>
                        </FadeInUp>

                        <FadeInUp delay={0.1}>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                                Cursuri complete de fizică pentru liceu
                            </h2>
                        </FadeInUp>

                        <FadeInUp delay={0.2}>
                            <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">
                                Nu mai pierzi ore încercând să înțelegi de pe manuale învechite. Cu PLANCK,
                                ai acces la lecții video clare, explicații pas cu pas și un asistent AI
                                care îți răspunde la orice întrebare — ca și cum ai avea un profesor
                                particular disponibil non-stop.
                            </p>
                        </FadeInUp>

                        {/* Features grid */}
                        <FadeInUp delay={0.3}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors duration-300"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <feature.icon className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                                            <p className="text-gray-500 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeInUp>

                        {/* CTA Buttons */}
                        <FadeInUp delay={0.4}>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/cursuri">
                                    <Button
                                        size="lg"
                                        className="bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 rounded-full px-8"
                                    >
                                        <Play className="w-4 h-4" />
                                        Explorează cursurile
                                    </Button>
                                </Link>
                                <Link href="/register" className="group relative inline-flex">
                                    <span className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>
                                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>
                                    <span className="absolute inset-[1px] rounded-full bg-transparent group-hover:bg-transparent -z-10 pointer-events-none"></span>

                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="border-white/30 text-white hover:border-transparent transition-all duration-300 flex items-center gap-2 bg-transparent relative z-10 rounded-full px-8"
                                    >
                                        <span className="relative z-10 bg-gradient-to-r from-white to-white group-hover:from-purple-400 group-hover:to-blue-400 bg-clip-text group-hover:text-transparent transition-all duration-300 flex items-center gap-2">
                                            Creează cont
                                        </span>
                                    </Button>
                                </Link>
                            </div>
                        </FadeInUp>
                    </div>
                </div>

                {/* Stats Icons Grid */}
                <FadeInUp delay={0.5} className="mt-20 lg:mt-28">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 max-w-5xl mx-auto">
                        {/* Stat 1 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <GraduationCap className="w-7 h-7 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">50+ Lecții explicate</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Toate capitolele de fizică pentru liceu, explicate clar și pe înțelesul tău.</p>
                            </div>
                        </div>

                        {/* Stat 2 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Clock className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Disponibil 24/7</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Învață oricând vrei, de pe orice dispozitiv. Fără program fix.</p>
                            </div>
                        </div>

                        {/* Stat 3 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Users className="w-7 h-7 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">1000+ Elevi activi</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">O comunitate de elevi care învață fizica mai ușor cu PLANCK.</p>
                            </div>
                        </div>

                        {/* Stat 4 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <MessageCircle className="w-7 h-7 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Asistent AI integrat</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Pune întrebări și primești răspunsuri instant, direct în lecție.</p>
                            </div>
                        </div>

                        {/* Stat 5 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-pink-500/10">
                                <Award className="w-7 h-7 text-pink-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Certificat de finalizare</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Primești un certificat pentru fiecare curs finalizat complet.</p>
                            </div>
                        </div>

                        {/* Stat 6 */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/10">
                                <Zap className="w-7 h-7 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Progres în timp real</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Urmărește-ți progresul și continuă de unde ai rămas.</p>
                            </div>
                        </div>
                    </div>
                </FadeInUp>
            </div>
        </section>
    )
}
