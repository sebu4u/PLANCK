'use client'

import { Button } from "@/components/ui/button"
import { PlayCircle } from "lucide-react"

const scrollToCourses = () => {
  const coursesSection = document.getElementById('courses')
  if (coursesSection) {
    coursesSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

export function ScrollToCoursesButton() {
  return (
    <Button
      size="lg"
      onClick={scrollToCourses}
      className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 cosmic-glow"
    >
      <PlayCircle className="w-5 h-5 mr-2" />
      Începe să înveți acum
    </Button>
  )
}
