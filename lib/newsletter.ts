/**
 * Newsletter utility functions
 * Contains helper functions for email validation and API interactions
 */

/**
 * Validates email format using a comprehensive regex pattern
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  // Comprehensive email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim())
}

/**
 * Sanitizes email address by trimming whitespace and converting to lowercase
 * @param email - Email address to sanitize
 * @returns sanitized email address
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Rate limiting helper - stores submission attempts in localStorage
 * Prevents spam submissions from the same browser
 */
export class NewsletterRateLimiter {
  private static readonly STORAGE_KEY = 'newsletter_submission_attempts'
  private static readonly MAX_ATTEMPTS = 5
  private static readonly WINDOW_MS = 60 * 60 * 1000 // 1 hour

  /**
   * Checks if user has exceeded rate limit
   * @returns boolean indicating if rate limit is exceeded
   */
  static isRateLimited(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const attempts = this.getAttempts()
      const now = Date.now()
      
      // Remove old attempts outside the time window
      const recentAttempts = attempts.filter(timestamp => now - timestamp < this.WINDOW_MS)
      
      return recentAttempts.length >= this.MAX_ATTEMPTS
    } catch (error) {
      console.error('Rate limiting check failed:', error)
      return false
    }
  }

  /**
   * Records a submission attempt
   */
  static recordAttempt(): void {
    if (typeof window === 'undefined') return

    try {
      const attempts = this.getAttempts()
      attempts.push(Date.now())
      
      // Keep only recent attempts
      const now = Date.now()
      const recentAttempts = attempts.filter(timestamp => now - timestamp < this.WINDOW_MS)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentAttempts))
    } catch (error) {
      console.error('Failed to record submission attempt:', error)
    }
  }

  /**
   * Gets submission attempts from localStorage
   * @returns array of timestamps
   */
  private static getAttempts(): number[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get submission attempts:', error)
      return []
    }
  }

  /**
   * Clears all submission attempts (useful for testing)
   */
  static clearAttempts(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

/**
 * Newsletter API response types
 */
export interface NewsletterResponse {
  success: boolean
  message: string
  data?: any
}

/**
 * Submits email to newsletter API
 * @param email - Email address to subscribe
 * @returns Promise with API response
 */
export async function subscribeToNewsletter(email: string): Promise<NewsletterResponse> {
  // Check rate limiting
  if (NewsletterRateLimiter.isRateLimited()) {
    throw new Error('Prea multe încercări. Te rugăm să încerci din nou în câteva minute.')
  }

  // Record attempt
  NewsletterRateLimiter.recordAttempt()

  const response = await fetch('/api/newsletter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: sanitizeEmail(email) }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'A apărut o eroare la abonare')
  }

  return data
}
