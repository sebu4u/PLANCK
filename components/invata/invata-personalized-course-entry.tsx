"use client"

import { useAuth } from "@/components/auth-provider"
import {
  PersonalizedCourseGeneratorEntry,
  type PersonalizedCourseGeneratorEntryProps,
} from "@/components/invata/personalized-course-generator-entry"

type InvataPersonalizedCourseEntryProps = Pick<PersonalizedCourseGeneratorEntryProps, "className">

export function InvataPersonalizedCourseEntry({ className }: InvataPersonalizedCourseEntryProps) {
  const { user } = useAuth()
  const isAuthenticated = Boolean(user)

  return (
    <PersonalizedCourseGeneratorEntry
      isAuthenticated={isAuthenticated}
      canGeneratePersonalizedPath={isAuthenticated}
      personalizedPathBlockedReason={null}
      className={className}
    />
  )
}
