'use client'

import React from 'react'
import { CookieManager } from './cookie-management'

// Tipuri pentru events custom PLANCK
export interface CourseEvent {
  course_id: string
  course_name: string
  chapter?: string
  user_grade?: string
}

export interface ProblemEvent {
  problem_id: string
  problem_difficulty?: string
  problem_category?: string
  time_spent?: number
  hints_used?: number
}

export interface UserEvent {
  user_id?: string
  user_grade?: string
  badge_earned?: string
  level_achieved?: string
}

export interface EngagementEvent {
  content_type: 'video' | 'text' | 'interactive' | 'quiz'
  content_id: string
  duration?: number
  completion_rate?: number
}

class PlanckAnalytics {
  private static instance: PlanckAnalytics
  private isInitialized = false
  private cookieManager: CookieManager

  constructor() {
    this.cookieManager = CookieManager.getInstance()
  }

  static getInstance(): PlanckAnalytics {
    if (!PlanckAnalytics.instance) {
      PlanckAnalytics.instance = new PlanckAnalytics()
    }
    return PlanckAnalytics.instance
  }

  // Initializează Google Analytics dacă este permis
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return

    if (!this.cookieManager.hasAnalyticsConsent()) {
      console.log('Analytics not initialized: no consent')
      return
    }

    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (!measurementId) {
      console.error('Google Analytics Measurement ID not found')
      return
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      document.head.appendChild(script)

      // Initialize gtag
      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      window.gtag = gtag

      gtag('js', new Date())
      gtag('config', measurementId, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
        send_page_view: false // Vom trimite manual page views
      })

      this.isInitialized = true
      console.log('Google Analytics initialized successfully')
    } catch (error) {
      console.error('Error initializing Google Analytics:', error)
    }
  }

  // Verifică dacă analytics este disponibil
  canTrack(): boolean {
    return this.isInitialized && 
           this.cookieManager.hasAnalyticsConsent() && 
           typeof window !== 'undefined' && 
           typeof window.gtag === 'function'
  }

  // Helper pentru a verifica dacă poate face tracking
  private canTrackSafely(): boolean {
    return this.canTrack() && typeof window !== 'undefined' && window.gtag
  }

  // Tracking de bază
  trackPageView(url: string, title?: string): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: url,
      page_path: new URL(url).pathname
    })
  }

  // Events pentru cursuri
  trackCourseView(course: CourseEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'course_view', {
      course_id: course.course_id,
      course_name: course.course_name,
      chapter: course.chapter,
      user_grade: course.user_grade
    })
  }

  trackCourseStart(course: CourseEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'course_start', {
      course_id: course.course_id,
      course_name: course.course_name,
      chapter: course.chapter,
      user_grade: course.user_grade
    })
  }

  trackChapterComplete(course: CourseEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'chapter_complete', {
      course_id: course.course_id,
      course_name: course.course_name,
      chapter: course.chapter,
      user_grade: course.user_grade
    })
  }

  trackCourseComplete(course: CourseEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'course_complete', {
      course_id: course.course_id,
      course_name: course.course_name,
      user_grade: course.user_grade
    })
  }

  // Events pentru probleme
  trackProblemView(problem: ProblemEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'problem_view', {
      problem_id: problem.problem_id,
      problem_difficulty: problem.problem_difficulty,
      problem_category: problem.problem_category
    })
  }

  trackProblemAttempt(problem: ProblemEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'problem_attempt', {
      problem_id: problem.problem_id,
      problem_difficulty: problem.problem_difficulty,
      problem_category: problem.problem_category
    })
  }

  trackProblemSolved(problem: ProblemEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'problem_solved', {
      problem_id: problem.problem_id,
      problem_difficulty: problem.problem_difficulty,
      problem_category: problem.problem_category,
      time_spent: problem.time_spent,
      hints_used: problem.hints_used
    })
  }

  trackHintUsed(problem: ProblemEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'hint_used', {
      problem_id: problem.problem_id,
      problem_difficulty: problem.problem_difficulty
    })
  }

  trackSolutionViewed(problem: ProblemEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'solution_viewed', {
      problem_id: problem.problem_id,
      problem_difficulty: problem.problem_difficulty
    })
  }

  // Events pentru progresul utilizatorului
  trackBadgeEarned(user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'badge_earned', {
      badge_name: user.badge_earned,
      user_grade: user.user_grade
    })
  }

  trackLevelUp(user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'level_up', {
      level_achieved: user.level_achieved,
      user_grade: user.user_grade
    })
  }

  trackStreakAchieved(days: number, user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'streak_achieved', {
      streak_days: days,
      user_grade: user.user_grade
    })
  }

  // Events pentru conținut educațional
  trackVideoPlay(engagement: EngagementEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'video_play', {
      content_type: engagement.content_type,
      content_id: engagement.content_id
    })
  }

  trackVideoComplete(engagement: EngagementEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'video_complete', {
      content_type: engagement.content_type,
      content_id: engagement.content_id,
      duration: engagement.duration,
      completion_rate: engagement.completion_rate
    })
  }

  trackContentInteraction(engagement: EngagementEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'content_interaction', {
      content_type: engagement.content_type,
      content_id: engagement.content_id,
      duration: engagement.duration
    })
  }

  // Events pentru business/conversie
  trackNewsletterSignup(): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'newsletter_signup', {
      event_category: 'engagement',
      event_label: 'newsletter'
    })
  }

  trackUserRegistration(user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'user_register', {
      user_grade: user.user_grade,
      event_category: 'conversion'
    })
  }

  trackProfileComplete(user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'profile_complete', {
      user_grade: user.user_grade,
      event_category: 'engagement'
    })
  }

  // Events pentru căutare și filtrare
  trackSearchPerformed(query: string, resultsCount: number): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'search', {
      search_term: query,
      results_count: resultsCount
    })
  }

  trackFilterApplied(filterType: string, filterValue: string): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'filter_applied', {
      filter_type: filterType,
      filter_value: filterValue
    })
  }

  // Events pentru feedback
  trackFeedbackSubmitted(rating: number, category: string): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', 'feedback_submitted', {
      rating: rating,
      feedback_category: category
    })
  }

  // Setează proprietăți utilizator
  setUserProperties(user: UserEvent): void {
    if (!this.canTrackSafely()) return

    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: user.user_id,
      custom_map: {
        user_grade: user.user_grade
      }
    })
  }

  // Custom event generic
  trackCustomEvent(eventName: string, parameters: Record<string, any>): void {
    if (!this.canTrackSafely()) return

    window.gtag('event', eventName, parameters)
  }
}

// Hook pentru a folosi analytics în componente React
export function useAnalytics() {
  const analytics = PlanckAnalytics.getInstance()
  const cookieManager = CookieManager.getInstance()

  return {
    // Verificări
    canTrack: analytics.canTrack(),
    isInitialized: analytics.isInitialized,
    
    // Initialize
    initialize: () => analytics.initialize(),
    
    // Tracking de bază
    trackPageView: (url: string, title?: string) => analytics.trackPageView(url, title),
    
    // Cursuri
    trackCourseView: (course: CourseEvent) => analytics.trackCourseView(course),
    trackCourseStart: (course: CourseEvent) => analytics.trackCourseStart(course),
    trackChapterComplete: (course: CourseEvent) => analytics.trackChapterComplete(course),
    trackCourseComplete: (course: CourseEvent) => analytics.trackCourseComplete(course),
    
    // Probleme
    trackProblemView: (problem: ProblemEvent) => analytics.trackProblemView(problem),
    trackProblemAttempt: (problem: ProblemEvent) => analytics.trackProblemAttempt(problem),
    trackProblemSolved: (problem: ProblemEvent) => analytics.trackProblemSolved(problem),
    trackHintUsed: (problem: ProblemEvent) => analytics.trackHintUsed(problem),
    trackSolutionViewed: (problem: ProblemEvent) => analytics.trackSolutionViewed(problem),
    
    // Progres utilizator
    trackBadgeEarned: (user: UserEvent) => analytics.trackBadgeEarned(user),
    trackLevelUp: (user: UserEvent) => analytics.trackLevelUp(user),
    trackStreakAchieved: (days: number, user: UserEvent) => analytics.trackStreakAchieved(days, user),
    
    // Conținut educațional
    trackVideoPlay: (engagement: EngagementEvent) => analytics.trackVideoPlay(engagement),
    trackVideoComplete: (engagement: EngagementEvent) => analytics.trackVideoComplete(engagement),
    trackContentInteraction: (engagement: EngagementEvent) => analytics.trackContentInteraction(engagement),
    
    // Business/Conversie
    trackNewsletterSignup: () => analytics.trackNewsletterSignup(),
    trackUserRegistration: (user: UserEvent) => analytics.trackUserRegistration(user),
    trackProfileComplete: (user: UserEvent) => analytics.trackProfileComplete(user),
    
    // Căutare și filtrare
    trackSearchPerformed: (query: string, resultsCount: number) => analytics.trackSearchPerformed(query, resultsCount),
    trackFilterApplied: (filterType: string, filterValue: string) => analytics.trackFilterApplied(filterType, filterValue),
    
    // Feedback
    trackFeedbackSubmitted: (rating: number, category: string) => analytics.trackFeedbackSubmitted(rating, category),
    
    // Utilizator
    setUserProperties: (user: UserEvent) => analytics.setUserProperties(user),
    
    // Custom
    trackCustomEvent: (eventName: string, parameters: Record<string, any>) => analytics.trackCustomEvent(eventName, parameters)
  }
}

// Declarăm gtag global pentru TypeScript
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

