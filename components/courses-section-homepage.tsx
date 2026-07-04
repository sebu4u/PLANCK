"use client"

import Link from "next/link"
import Image from "next/image"
import { type CSSProperties } from "react"
import { ArrowRight, Atom, BookOpen, CheckCircle2, Code2, Dna, Play, Sigma, Sparkles } from "lucide-react"
import {
  LEARNING_PATHS_GRADES_LABEL,
  LEARNING_PATHS_SUBJECTS,
  QUIZ_COUNT_LABEL,
  VIDEO_SOLUTIONS_LABEL,
} from "@/lib/platform-marketing"

const SUBJECT_PATHS = [
  {
    id: "fizica",
    label: "Fizică",
    href: "/invata/fizica",
    icon: Atom,
    iconBg: "bg-[#EBE8FF]",
    iconColor: "text-[#7C5CFC]",
    chapters: "Mecanică, Termodinamică, Optică…",
    live: true,
  },
  {
    id: "matematica",
    label: "Matematică",
    href: "/invata",
    icon: Sigma,
    iconBg: "bg-[#EFF6FF]",
    iconColor: "text-[#3B82F6]",
    chapters: "Algebră, Geometrie, Analiză…",
    live: false,
  },
  {
    id: "informatica",
    label: "Informatică",
    href: "/invata",
    icon: Code2,
    iconBg: "bg-[#FFF5E6]",
    iconColor: "text-[#F59E3A]",
    chapters: "Algoritmi, Structuri de date…",
    live: false,
  },
  {
    id: "biologie",
    label: "Biologie",
    href: "/invata",
    icon: Dna,
    iconBg: "bg-[#ECFDF5]",
    iconColor: "text-[#10B981]",
    chapters: "Celula, Genetică, Ecologie…",
    live: false,
  },
] as const

const PATH_STEPS = [
  {
    title: "Capitole structurate",
    description: "Materia e împărțită pe capitole clare, de la clasa a IX-a până la a XII-a.",
  },
  {
    title: "Lecții, grile și video",
    description: `${QUIZ_COUNT_LABEL}, ${VIDEO_SOLUTIONS_LABEL.toLowerCase()} și exerciții interactive.`,
  },
  {
    title: "Progres salvat",
    description: "Continui de unde ai rămas — pe telefon, tabletă sau laptop.",
  },
] as const

const MOCK_LESSONS = [
  { title: "Traiectoria unui corp", progress: 72 },
  { title: "Viteza medie", progress: 45 },
  { title: "Mișcarea rectilinie uniformă", progress: 18 },
] as const

function PathPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#7C5CFC]/10 via-transparent to-[#ffb56b]/10 blur-2xl" aria-hidden />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.12)]">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7C5CFC]">
                Traseu · Fizică
              </p>
              <p className="mt-0.5 text-base font-bold text-gray-900">Cinematica punctului material</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#EBE8FF] px-3 py-1 text-xs font-semibold text-[#5B47D6]">
              Clasa a IX-a
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {MOCK_LESSONS.map((lesson) => (
            <div
              key={lesson.title}
              className="flex items-center gap-3 rounded-xl border-[3px] border-[#e6e6e6] bg-white px-3.5 py-3 shadow-[0_4px_0_#e6e6e6]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f3f0ff]">
                <Image
                  src="/images/icons/Untitled%20design%20(47).png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{lesson.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                nou
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="h-3.5 w-3.5 text-[#7C5CFC]" aria-hidden />
            Insight îți recomandă următoarea lecție din traseu
          </div>
        </div>
      </div>
    </div>
  )
}

function SubjectPathCard({
  subject,
}: {
  subject: (typeof SUBJECT_PATHS)[number]
}) {
  const Icon = subject.icon

  return (
    <Link
      href={subject.href}
      className="group flex flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#EBE8FF] hover:shadow-[0_12px_40px_-12px_rgba(124,92,252,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${subject.iconBg}`}>
          <Icon className={`h-5 w-5 ${subject.iconColor}`} aria-hidden />
        </div>
        {subject.live ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Disponibil
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
            În curând
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-bold text-gray-900">{subject.label}</h3>
      <p className="mt-1 text-sm text-gray-500">{LEARNING_PATHS_GRADES_LABEL}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-snug text-gray-600">{subject.chapters}</p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C5CFC] transition-colors group-hover:text-[#5B47D6]">
        Vezi traseul
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}

export function CoursesSectionHomepage() {
  return (
    <section
      className="bg-gradient-to-b from-white via-[#faf9ff] to-[#f5f3ff] py-16 sm:py-20 lg:py-24"
      aria-labelledby="home-courses-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="scroll-animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Trasee de învățare
          </span>

          <h2
            id="home-courses-heading"
            className="scroll-animate-fade-up animate-delay-100 mt-5 text-3xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
          >
            Toată materia de liceu,{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
              pas cu pas
            </span>
          </h2>

          <p className="scroll-animate-fade-up animate-delay-200 mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Parcurge trasee structurate pentru {LEARNING_PATHS_SUBJECTS.join(", ")} — de la primul
            capitol până la pregătirea pentru BAC sau admitere.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <div className="scroll-animate-fade-up animate-delay-300 order-1 lg:order-1">
            <PathPreviewMockup />
          </div>

          <div className="scroll-animate-fade-up animate-delay-200 order-2 space-y-6 lg:order-2">
            {PATH_STEPS.map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                  <CheckCircle2 className="h-4 w-4 text-[#7C5CFC]" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-animate-fade-up animate-delay-400 mt-12 lg:mt-16">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Alege materia ta</h3>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Fiecare traseu acoperă {LEARNING_PATHS_GRADES_LABEL.toLowerCase()}, cu lecții și exerciții
                verificate de profesori.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {SUBJECT_PATHS.map((subject) => (
              <SubjectPathCard key={subject.id} subject={subject} />
            ))}
          </div>
        </div>

        <div className="scroll-animate-fade-up animate-delay-600 mt-10 flex justify-center lg:mt-12">
          <Link
            href="/invata"
            className="dashboard-start-glow inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#7C5CFC] px-8 text-base font-semibold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"
            style={{ "--start-glow-tint": "rgba(224, 215, 255, 0.88)" } as CSSProperties}
          >
            <Play className="h-4 w-4 shrink-0 fill-white text-white" aria-hidden />
            Explorează traseele
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
