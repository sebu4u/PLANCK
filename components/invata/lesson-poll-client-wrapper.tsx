"use client"

import { LessonPoll, type LessonPollOption } from "@/components/invata/lesson-poll"

interface LessonPollClientWrapperProps {
  imageSrc: string
  imageAlt: string
  correctAnswerId: string
  options: LessonPollOption[]
}

export function LessonPollClientWrapper({
  imageSrc,
  imageAlt,
  correctAnswerId,
  options,
}: LessonPollClientWrapperProps) {
  return (
    <LessonPoll
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      options={options}
      correctAnswerId={correctAnswerId}
    />
  )
}
