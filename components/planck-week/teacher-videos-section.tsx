"use client"

import Image from "next/image"
import { FadeInUp } from "@/components/scroll-animations"
import { extractYouTubeVideoId, LazyYouTubePlayer } from "@/components/lazy-youtube-player"
import { LANDING_TEACHERS } from "@/lib/landing-teachers"
import { PLANCK_WEEK_TEACHER_VIDEOS } from "@/lib/planck-week"
import { WORKSHOP_SUBJECT_LABELS } from "@/lib/pregatire/types"

export function PlanckWeekTeacherVideosSection() {
  return (
    <section className="bg-white pb-16 pt-4 sm:pb-20 sm:pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Vezi cum predau mentorii
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Patru clipuri scurte, din meditațiile live — aceeași energie pe care o prinzi în Planck
            Week.
          </p>
        </FadeInUp>

        <div
          className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {PLANCK_WEEK_TEACHER_VIDEOS.map((video, index) => {
            const videoId = extractYouTubeVideoId(video.youtubeUrl)
            const teacher = LANDING_TEACHERS.find((item) => item.id === video.teacherId)
            const caption = `${video.name} · ${WORKSHOP_SUBJECT_LABELS[video.subject]}`

            return (
              <FadeInUp
                key={video.teacherId}
                delay={0.06 * index}
                className="w-[min(13.5rem,72vw)] shrink-0 snap-center sm:w-auto"
              >
                <div className="overflow-hidden rounded-[24px] shadow-[0_12px_32px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.06]">
                  {videoId ? (
                    <LazyYouTubePlayer
                      videoId={videoId}
                      title={caption}
                      caption={caption}
                      aspect="9/16"
                      className="rounded-none shadow-none"
                    />
                  ) : (
                    <div className="relative aspect-[9/16] bg-gray-100">
                      {teacher?.imageSrc ? (
                        <Image
                          src={teacher.imageSrc}
                          alt={video.name}
                          fill
                          className="object-cover"
                          style={{ objectPosition: teacher.imagePosition ?? "center" }}
                          sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 18vw"
                        />
                      ) : null}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-12">
                        <p className="text-sm font-bold leading-snug tracking-tight text-white">
                          {caption}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </FadeInUp>
            )
          })}
        </div>
      </div>
    </section>
  )
}
