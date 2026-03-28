import { BookOpen } from "lucide-react"
import { getItemIcon } from "@/components/invata/learning-path-item-body"
import { LockedLessonBottomCta } from "@/components/invata/locked-lesson-bottom-cta"
import { LockedLevelStickyCard } from "@/components/invata/locked-level-sticky-card"
import type { LearningPathChapter, LearningPathLesson, LearningPathLessonType } from "@/lib/supabase-learning-paths"

interface LearningPathLessonLockedPreviewProps {
  chapter: LearningPathChapter
  lesson: LearningPathLesson
}

const NODE_ROW_OFFSETS = ["ml-[6%]", "ml-[26%]", "ml-[12%]", "ml-[32%]", "ml-[18%]"]

const PLACEHOLDER_LABELS = [
  "Fundamente de baza",
  "Concept cheie",
  "Exercitiu ghidat",
  "Intrebare rapida",
  "Problema aplicata",
  "Recapitulare",
  "Conexiuni utile",
  "Metoda de lucru",
  "Capcane frecvente",
  "Test scurt",
  "Provocare finala",
  "Concluzii",
]

const LEVEL_BLURRED_TITLES = [
  "Introducere si notiuni fundamentale",
  "Aprofundare si aplicatii practice",
  "Consolidare si evaluare finala",
]

const ITEMS_PER_LEVEL = 4

/** Tipuri de item rotite pentru iconițe blurate în preview (ca pe path-ul real). */
const ICON_TYPE_CYCLE: LearningPathLessonType[] = [
  "text",
  "video",
  "grila",
  "problem",
  "poll",
  "simulation",
  "custom_text",
  "text",
  "video",
  "grila",
  "problem",
  "poll",
]

/**
 * Contur o singură culoare: laturi 3px, baza mai groasă (6px). Purely decorative divs.
 */
const LEVEL_CARD_THEMES = [
  { outline: "#7c3aed", label: "text-[#7c3aed]" },
  { outline: "#2563eb", label: "text-[#2563eb]" },
  { outline: "#059669", label: "text-[#059669]" },
] as const

export function LearningPathLessonLockedPreview({ chapter, lesson }: LearningPathLessonLockedPreviewProps) {
  const levelCount = Math.ceil(PLACEHOLDER_LABELS.length / ITEMS_PER_LEVEL)

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-28 sm:px-8 lg:px-12">
      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="border-0 bg-transparent p-0 shadow-none lg:max-h-[calc(100vh-8rem)] lg:self-start lg:sticky lg:top-28 lg:rounded-[24px] lg:border lg:border-[#e8e2ee] lg:bg-white lg:p-5 lg:shadow-[0_12px_32px_rgba(82,44,111,0.08)]">
          <div className="flex w-full justify-center bg-transparent lg:justify-start">
            {lesson.image_url ? (
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="mx-auto h-36 w-auto max-w-full object-contain sm:h-40 lg:mx-0 lg:h-36 lg:object-left"
                loading="lazy"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center text-[#8a8a95] sm:h-40 sm:w-40 lg:h-36 lg:w-36">
                <BookOpen className="h-9 w-9 sm:h-10 sm:w-10 lg:h-10 lg:w-10" />
              </div>
            )}
          </div>

          <div className="mt-5 w-full text-center lg:mt-4 lg:text-left">
            <p className="mb-0 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6fac] sm:text-xs lg:mb-2 lg:block">{chapter.title}</p>
            <h1 className="text-xl font-bold leading-tight text-[#111111] sm:text-2xl lg:mt-1">{lesson.title}</h1>
            <p className="mt-3 text-sm leading-snug text-[#6f657b] lg:mt-3 lg:text-sm">
              Continutul complet al acestei lectii va fi disponibil in curand.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#22192d] lg:mt-4">12 itemi premium</p>
          </div>
        </aside>

        <section className="relative min-w-0">
          {Array.from({ length: levelCount }, (_, levelIndex) => {
            const start = levelIndex * ITEMS_PER_LEVEL
            const levelItems = PLACEHOLDER_LABELS.slice(start, start + ITEMS_PER_LEVEL)
            const levelNumber = levelIndex + 1
            const blurredTitle = LEVEL_BLURRED_TITLES[levelIndex] ?? `Sectiunea ${levelNumber}`

            const theme = LEVEL_CARD_THEMES[levelIndex % LEVEL_CARD_THEMES.length]

            return (
              <div key={levelNumber}>
                <LockedLevelStickyCard
                  levelNumber={levelNumber}
                  blurredTitle={blurredTitle}
                  outlineColor={theme.outline}
                  labelColorClass={theme.label}
                />

                <div className="flex flex-col items-center">
                  {levelItems.map((label, localIndex) => {
                    const globalIndex = start + localIndex
                    const offsetClass = NODE_ROW_OFFSETS[globalIndex % NODE_ROW_OFFSETS.length]
                    const isLastGlobal = globalIndex === PLACEHOLDER_LABELS.length - 1
                    const iconType = ICON_TYPE_CYCLE[globalIndex % ICON_TYPE_CYCLE.length]
                    const ItemIcon = getItemIcon(iconType)

                    return (
                      <div key={`${label}-${globalIndex + 1}`} className={`relative mb-10 w-fit max-w-full ${offsetClass}`}>
                        {!isLastGlobal ? (
                          <div className="pointer-events-none absolute left-10 top-20 h-24 w-[3px] rounded-full bg-gradient-to-b from-[#ddd3ea] via-[#ece8f5] to-transparent" />
                        ) : null}

                        <div className="flex max-w-full items-center gap-4">
                          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                            <span className="absolute inset-[1px] rounded-full bg-[#d9d9de]" />
                            <span className="absolute inset-[9px] rounded-full border border-white/70 bg-[#f4f4f7]" />
                            <ItemIcon
                              className="relative z-[1] h-8 w-8 text-[#9a9aa2] blur-[2.5px]"
                              aria-hidden
                              strokeWidth={1.75}
                            />
                          </span>

                          <span className="min-w-0">
                            <span className="block max-w-[min(100%,280px)] text-sm font-semibold text-[#b7b0be] blur-[1.8px] sm:text-base">
                              {label}
                            </span>
                            <span className="mt-1 block text-xs text-[#d0c9d7] blur-[1.2px]">Continut blocat</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="mt-6 h-[140px] w-full shrink-0" aria-hidden="true" />
          <LockedLessonBottomCta />
        </section>
      </div>
    </div>
  )
}
