"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video-player"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Clock, Users, Star, BookOpen } from "lucide-react"

interface CoursePreviewModalProps {
  course: {
    id: string
    title: string
    subtitle: string
    description: string
    videoUrl: string
    chapters: number
    duration: string
    students: number
    rating: number
    price: string
    freeChapters: number
  }
  trigger?: React.ReactNode
}

export function CoursePreviewModal({ course, trigger }: CoursePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const defaultTrigger = (
    <Button variant="outline" className="border-purple-300 hover:border-purple-500 hover:text-purple-600">
      <PlayCircle className="w-4 h-4 mr-2" />
      Preview
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Player */}
          <div className="aspect-video">
            <VideoPlayer
              src="/placeholder-video.mp4" // Replace with actual video URL
              title={`Preview: ${course.title}`}
              poster="/placeholder.svg?height=400&width=600"
              className="w-full h-full"
            />
          </div>

          {/* Course Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Badge className="bg-purple-100 text-purple-700 mb-3">{course.subtitle}</Badge>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{course.title}</h3>
              <p className="text-gray-600 mb-4">{course.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{course.students} studenți</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.chapters} capitole</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{course.rating}/5</span>
                </div>
              </div>
            </div>

            <div>
              {/* Free Content Highlight */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Conținut gratuit</span>
                </div>
                <p className="text-green-700 text-sm">{course.freeChapters} capitole gratuite disponibile imediat</p>
              </div>

              {/* Pricing */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{course.price}</div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  onClick={() => setIsOpen(false)}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Începe cursul
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
