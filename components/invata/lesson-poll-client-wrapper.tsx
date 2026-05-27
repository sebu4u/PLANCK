"use client"

import { LessonPoll, type LessonPollOption } from "@/components/invata/lesson-poll"

interface LessonPollClientWrapperProps {
  imageSrc: string
  imageAlt: string
  options: LessonPollOption[]
}

export function LessonPollClientWrapper({
  imageSrc,
  imageAlt,
  options,
}: LessonPollClientWrapperProps) {
  return <LessonPoll imageSrc={imageSrc} imageAlt={imageAlt} options={options} />
}
