"use client"

import Image from "next/image"

export function AICodeAnalysisSection() {
    return (
        <section className="w-full py-24 lg:py-32 bg-white overflow-hidden relative">
            <div className="max-w-[1400px] mx-auto px-6 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Side - Content */}
                    <div className="space-y-8 lg:pr-12">
                        <div className="space-y-3">
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0b0d10] leading-tight tracking-tight">
                                Scrii cod.
                            </h2>

                            <p className="text-xl sm:text-2xl font-extrabold text-[#0b0d10] leading-tight tracking-tight">
                                Agentul AI din Planck îl înțelege, îl analizează și îți explică de ce funcționează sau de ce nu.
                                Exact ca un mentor bun, dar disponibil non-stop.
                            </p>
                        </div>

                        <div className="pt-4 space-y-4">
                            <p className="text-lg font-semibold text-[#0b0d10]">
                                Agentul AI:
                            </p>

                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start">
                                    <span className="mr-3 mt-1 text-orange-500">•</span>
                                    <span>analizează logica soluției tale</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-3 mt-1 text-orange-500">•</span>
                                    <span>identifică erori conceptuale, nu doar bug-uri</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-3 mt-1 text-orange-500">•</span>
                                    <span>îți explică pas cu pas ce face codul tău</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-3 mt-1 text-orange-500">•</span>
                                    <span>poate rezolva automat problema și compara soluția lui cu a ta</span>
                                </li>
                            </ul>

                            <div className="pt-6">
                                <p className="text-lg font-semibold text-[#0b0d10] mb-2">
                                    Rezultatul?
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    Nu mai înveți prin trial-and-error. Înveți prin înțelegere reală.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Image extending to screen edge */}
                    <div className="relative lg:absolute lg:left-[50%] lg:top-0 lg:h-full lg:w-[calc(50vw+((100vw-1400px)/2))]">
                        {/* Animated gradient border wrapper */}
                        <div className="absolute inset-0 rounded-3xl lg:rounded-l-3xl lg:rounded-r-none overflow-hidden animate-border-glow-shadow">
                            <div className="absolute inset-0 animate-border-glow opacity-80"></div>
                        </div>

                        {/* Image container with inset to show border */}
                        <div className="absolute inset-[4px] rounded-3xl lg:rounded-l-3xl lg:rounded-r-none overflow-hidden shadow-2xl">
                            <div className="relative w-full h-full min-h-[400px]">
                                <Image
                                    src="/code_analysis_demo.png"
                                    alt="AI Code Analysis Demo"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
