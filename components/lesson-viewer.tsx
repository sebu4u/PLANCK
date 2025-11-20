'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Download,
  Target
} from 'lucide-react'
import { Lesson } from '@/lib/supabase-physics'
import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

interface LessonViewerProps {
  lesson: Lesson | null
  onPreviousLesson?: () => void
  onNextLesson?: () => void
  hasPrevious: boolean
  hasNext: boolean
  currentGrade?: number
  onProgressChange?: (progress: number) => void
}

export function LessonViewer({ 
  lesson, 
  onPreviousLesson, 
  onNextLesson, 
  hasPrevious, 
  hasNext,
  currentGrade,
  onProgressChange
}: LessonViewerProps) {
  const [progress, setProgress] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)

  useEffect(() => {
    if (lesson) {
      // Reset progress when lesson changes
      setProgress(0)
      setShowProgressBar(false)
      if (onProgressChange) {
        onProgressChange(0)
      }
    }
  }, [lesson])

  // Urmărește scroll-ul pentru progres - separat de renderizarea LaTeX
          useEffect(() => {
            let ticking = false

            const handleScroll = () => {
              if (!ticking) {
                requestAnimationFrame(() => {
                  if (!lesson) return

                  const windowHeight = window.innerHeight
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                  
                  // Găsește elementul de conținut al lecției (fără footer)
                  const lessonContent = document.querySelector('.lesson-content')
                  if (!lessonContent) return
                  
                  const contentRect = lessonContent.getBoundingClientRect()
                  const contentTop = contentRect.top + scrollTop
                  const contentHeight = lessonContent.offsetHeight
                  
                  // Calculează progresul bazat pe scroll în conținutul lecției
                  const scrollInContent = Math.max(0, scrollTop - contentTop)
                  const maxScrollInContent = contentHeight - windowHeight
                  
                  if (maxScrollInContent <= 0) {
                    setProgress(100)
                    if (onProgressChange) onProgressChange(100)
                  } else {
                    const scrollProgress = Math.min(scrollInContent / maxScrollInContent, 1)
                    const progressPercentage = Math.max(0, Math.min(100, scrollProgress * 100))
                    setProgress(progressPercentage)
                    if (onProgressChange) onProgressChange(progressPercentage)
                  }
                  
                  // Afișează bara de progres doar când utilizatorul începe să dea scroll
                  if (scrollTop > 50) {
                    setShowProgressBar(true)
                  } else {
                    setShowProgressBar(false)
                  }
                  
                  ticking = false
                })
                ticking = true
              }
            }

            window.addEventListener('scroll', handleScroll, { passive: true })
            return () => window.removeEventListener('scroll', handleScroll)
          }, [lesson])



  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getGradeGradient = (grade: number) => {
    switch (grade) {
      case 9:
        return 'bg-gradient-to-r from-purple-600 to-pink-600' // Violet-roz
      case 10:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600' // Albastru-cyan
      case 11:
        return 'bg-gradient-to-r from-green-600 to-emerald-600' // Verde-emerald
      case 12:
        return 'bg-gradient-to-r from-orange-600 to-red-600' // Portocaliu-roșu
      default:
        return 'bg-gradient-to-r from-purple-600 to-pink-600' // Default violet-roz
    }
  }

  const renderInlineMarkdownContent = (content: string) => {
    let processedContent = content

    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    processedContent = processedContent.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Remove trailing newlines to prevent extra blank line at the end
    processedContent = processedContent.replace(/(?:\r?\n)+$/g, '')
    
    // Procesează link-urile - transformă link-urile către probleme în butoane
    processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      // Detectează link-uri către probleme
      if (url.startsWith('/probleme/') || url.includes('/probleme/')) {
        return `<a href="${url}" class="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center font-bold shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200">${text}</a>`
      }
      // Link-uri normale
      return `<a href="${url}" class="text-blue-600 hover:underline">${text}</a>`
    })
    
    processedContent = processedContent.replace(/\r?\n/g, '<br />')

    return processedContent
  }

  const renderInlineWithImages = (content: string, keyPrefix: string) => {
    if (!content) return null

    // Split by images first, then by math
    const imageParts = content.split(/(!\[([^\]]*)\]\(([^)]+)\))/g)
    
    return imageParts.map((part, idx) => {
      if (!part) return null
      
      // Check if this part is an image
      const imageMatch = part.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        const altText = imageMatch[1]
        const imageUrl = imageMatch[2]
        return (
          <img 
            key={`img-${keyPrefix}-${idx}`}
            src={imageUrl} 
            alt={altText}
            className="max-w-full h-auto rounded-lg shadow-md my-4 mx-auto block"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl, e)
              e.currentTarget.style.display = 'none'
            }}
          />
        )
      }
      
      // Process non-image parts with math
      const mathParts = part.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
      
      return mathParts.map((mathPart, mathIdx) => {
        if (!mathPart) return null

        if (mathPart.startsWith('$$') && mathPart.endsWith('$$')) {
          return (
            <BlockMath
              key={`display-${keyPrefix}-${idx}-${mathIdx}`}
              math={mathPart.slice(2, -2)}
              className="my-4 block text-center"
            />
          )
        }

        if (mathPart.startsWith('$') && mathPart.endsWith('$')) {
          return (
            <InlineMath key={`inline-${keyPrefix}-${idx}-${mathIdx}`} math={mathPart.slice(1, -1)} />
          )
        }

        const inlineHtml = renderInlineMarkdownContent(mathPart)

        return inlineHtml ? (
          <span key={`text-${keyPrefix}-${idx}-${mathIdx}`} dangerouslySetInnerHTML={{ __html: inlineHtml }} />
        ) : null
      })
    })
  }

  const renderInlineWithMath = (content: string, keyPrefix: string) => {
    if (!content) return null

    const parts = content.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)

    return parts.map((part, idx) => {
      if (!part) return null

      if (part.startsWith('$$') && part.endsWith('$$')) {
        return (
          <BlockMath
            key={`display-${keyPrefix}-${idx}`}
            math={part.slice(2, -2)}
            className="my-4 block text-center"
          />
        )
      }

      if (part.startsWith('$') && part.endsWith('$')) {
        return (
          <InlineMath key={`inline-${keyPrefix}-${idx}`} math={part.slice(1, -1)} />
        )
      }

      const inlineHtml = renderInlineMarkdownContent(part)

      return inlineHtml ? (
        <span key={`text-${keyPrefix}-${idx}`} dangerouslySetInnerHTML={{ __html: inlineHtml }} />
      ) : null
    })
  }

  const renderParagraphs = (content: string, keyPrefix: string) => {
    if (!content) return null

    const lines = content.split(/\r?\n/)
    const blocks: React.ReactNode[] = []
    let currentParagraph: string[] = []

    const flushParagraph = (key: number) => {
      if (currentParagraph.length === 0) return
      const paragraphText = currentParagraph.join('\n').trim()
      if (!paragraphText) {
        currentParagraph = []
        return
      }
      if (/^\$\$[\s\S]*\$\$$/m.test(paragraphText)) {
        blocks.push(
          <BlockMath
            key={`paragraph-display-${keyPrefix}-${key}`}
            math={paragraphText.replace(/^\$\$/, '').replace(/\$\$$/, '')}
            className="my-4 block text-center"
          />
        )
      } else {
        blocks.push(
          <div key={`paragraph-${keyPrefix}-${key}`} className="mb-4 leading-relaxed">
            {renderInlineWithImages(paragraphText, `${keyPrefix}-paragraph-${key}`)}
          </div>
        )
      }
      currentParagraph = []
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim()

      const headingMatch = line.match(/^\s*(#{1,4})\s+(.*)$/)
      if (headingMatch) {
        flushParagraph(idx)
        const level = headingMatch[1].length
        const headingContent = headingMatch[2].trim()
        const HeadingTag = (`h${level}`) as keyof JSX.IntrinsicElements
        const headingClasses = {
          1: 'text-3xl font-bold mb-6 text-gray-900 mt-8',
          2: 'text-2xl font-bold mb-4 text-gray-800 mt-6',
          3: 'text-xl font-semibold mb-3 text-gray-700 mt-5',
          4: 'text-lg font-semibold mb-2 text-gray-600 mt-4'
        } as const
        blocks.push(
          <HeadingTag key={`heading-${keyPrefix}-${idx}`} className={headingClasses[level]}>
            {renderInlineWithImages(headingContent, `${keyPrefix}-heading-${idx}`)}
          </HeadingTag>
        )
        return
      }

      if (trimmed.startsWith('[FORMULA]')) {
        flushParagraph(idx)
        const inner = trimmed.replace(/\[FORMULA\]|\[\/FORMULA\]/g, '')
        blocks.push(
          <div key={`formula-${keyPrefix}-${idx}`} className="formula-highlight">
            <div className="formula-content">
              {renderInlineWithImages(inner, `${keyPrefix}-formula-${idx}`)}
            </div>
          </div>
        )
        return
      }

      if (trimmed.startsWith('[ENUNT]') || trimmed.startsWith('[IMPORTANT]') || trimmed.startsWith('[DEFINITIE]') || trimmed.startsWith('[EXEMPLU]') || trimmed.startsWith('[INDENT]')) {
        flushParagraph(idx)
        const tagMatch = trimmed.match(/^\[(FORMULA|ENUNT|IMPORTANT|DEFINITIE|EXEMPLU|INDENT)\]([\s\S]*?)\[\/\1\]$/)
        if (tagMatch) {
          const tagType = tagMatch[1].toLowerCase()
          const inner = tagMatch[2].trim()
          blocks.push(
            <div key={`tag-${keyPrefix}-${idx}`} className={`${tagType}-highlight`}>
              <div className={`${tagType}-content`}>
                {renderInlineWithImages(inner, `${keyPrefix}-${tagType}-${idx}`)}
              </div>
            </div>
          )
        }
        return
      }

      if (trimmed === '') {
        flushParagraph(idx)
        return
      }

      if (/^\$\$[\s\S]*\$\$$/.test(line.trim())) {
        flushParagraph(idx)
        blocks.push(
          <BlockMath
            key={`inline-display-${keyPrefix}-${idx}`}
            math={line.trim().replace(/^\$\$|\$\$$/g, '')}
            className="my-4 block text-center"
          />
        )
        return
      }

      currentParagraph.push(line)
    })

    flushParagraph(lines.length)

    return blocks
  }

  const renderHighlightWithMath = (content: string, type: string, keyPrefix: string) => {
    const highlightClass = `${type}-highlight`
    const contentClass = `${type}-content`

    return (
      <div className={highlightClass}>
        <div className={contentClass}>
          {renderParagraphs(content, `${keyPrefix}-${type}`)}
        </div>
      </div>
    )
  }

  const renderContentWithMath = (content: string) => {
    const tagPattern = /(\[FORMULA\][\s\S]*?\[\/FORMULA\]|\[ENUNT\][\s\S]*?\[\/ENUNT\]|\[IMPORTANT\][\s\S]*?\[\/IMPORTANT\]|\[DEFINITIE\][\s\S]*?\[\/DEFINITIE\]|\[EXEMPLU\][\s\S]*?\[\/EXEMPLU\]|\[INDENT\][\s\S]*?\[\/INDENT\])/g
    const segments = content.split(tagPattern)

    return (
      <div>
        {segments.map((segment, idx) => {
          if (!segment) return null

          const tagMatch = segment.match(/^\[(FORMULA|ENUNT|IMPORTANT|DEFINITIE|EXEMPLU|INDENT)\]([\s\S]*?)\[\/\1\]$/)
          if (tagMatch) {
            const type = tagMatch[1].toLowerCase()
            const innerContent = tagMatch[2]
            return (
              <div key={`highlight-${idx}`}>
                {renderHighlightWithMath(innerContent, type, `highlight-${idx}`)}
              </div>
            )
          }

          const parts = segment.split(/(\$\$[^$]+\$\$)/g)

          return (
            <div key={`segment-${idx}`}>
              {parts.map((part, partIdx) => {
                if (!part) return null

                if (part.startsWith('$$') && part.endsWith('$$')) {
                  return (
                    <BlockMath
                      key={`display-${idx}-${partIdx}`}
                      math={part.slice(2, -2)}
                      className="my-4 block text-center"
                    />
                  )
                }

                return (
                  <div key={`paragraphs-${idx}-${partIdx}`}>
                    {renderParagraphs(part, `segment-${idx}-part-${partIdx}`)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-2xl bg-card">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Selectează o lecție
            </h3>
            <p className="text-gray-500">
              Alege o lecție din sidebar pentru a începe învățarea
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Progress Bar - Fixed at top, only over lesson content */}
      <div className={`fixed top-16 left-0 lg:left-80 right-0 z-50 lg:z-50 z-[85] bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ease-in-out ${
        showProgressBar 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progres lecție</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Lesson Header */}
      <div className={`${getGradeGradient(currentGrade || 9)} text-white p-4 lg:p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge className="bg-white/20 text-white">
                Lecția {lesson.order_index}
              </Badge>
              <div className="flex items-center gap-2 text-purple-100">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(lesson.estimated_duration)}</span>
              </div>
              {lesson.difficulty_level && (
                <div className="flex items-center gap-2 text-purple-100">
                  <Target className="w-4 h-4" />
                  <span>Nivel {lesson.difficulty_level}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white text-purple-600 hover:bg-white hover:text-pink-600 text-xs lg:text-sm">
                <Share2 className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Partajează</span>
              </Button>
              <Button variant="outline" size="sm" className="border-white text-purple-600 hover:bg-white hover:text-pink-600 text-xs lg:text-sm">
                <Download className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Descarcă</span>
              </Button>
            </div>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-bold mb-4 break-words">{lesson.title}</h1>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-100 text-sm">Progres lecție</span>
              <span className="text-purple-100 text-sm">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-purple-900/30" />
          </div>

          {/* Navigation */}
          <div className="flex flex-row justify-between gap-2">
            <Button
              variant="outline"
              className="border-white text-purple-600 hover:bg-white hover:text-pink-600 text-sm flex-1"
              onClick={onPreviousLesson}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lecția anterioară</span>
              <span className="sm:hidden">Anterioară</span>
            </Button>
            <Button
              className="bg-white text-purple-600 hover:bg-purple-50 text-sm flex-1"
              onClick={onNextLesson}
              disabled={!hasNext}
            >
              <span className="hidden sm:inline">Lecția următoare</span>
              <span className="sm:hidden">Următoare</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

              {/* Lesson Content */}
              <div className="p-4 lg:p-6">
                <div className="max-w-4xl mx-auto">
                  <Card className="border-purple-200 bg-card">
                            <CardContent className="p-4 lg:p-8 lesson-content">
                              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:break-words prose-p:break-words">
                                {renderContentWithMath(lesson.content)}
                              </div>
                            </CardContent>
                  </Card>

          {/* Navigation Buttons - Bottom */}
          <div className="mt-6 lg:mt-8 flex flex-row justify-between gap-2">
            <Button
              variant="outline"
              className="border-white text-purple-600 hover:bg-white hover:text-pink-600 text-sm flex-1"
              onClick={() => {
                onPreviousLesson?.()
                // Scroll la vârful paginii
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 100)
              }}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lecția anterioară</span>
              <span className="sm:hidden">Anterioară</span>
            </Button>
            <Button
              className="bg-white text-purple-600 hover:bg-purple-50 text-sm flex-1"
              onClick={() => {
                onNextLesson?.()
                // Scroll la vârful paginii
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 100)
              }}
              disabled={!hasNext}
            >
              <span className="hidden sm:inline">Lecția următoare</span>
              <span className="sm:hidden">Următoare</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
