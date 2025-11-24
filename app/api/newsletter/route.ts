import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// MailerLite API Configuration
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID
const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api'

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // Maximum requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute window

/**
 * Validates email format using a comprehensive regex pattern
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
function isValidEmail(email: string): boolean {
  // Regex mai robust pentru validare email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Checks if request is rate limited based on IP address
 * @param ip - IP address of the request
 * @returns boolean indicating if rate limit is exceeded
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  // Increment count
  record.count++
  return false
}

/**
 * Gets client IP address from request
 * @param request - NextRequest object
 * @returns IP address string
 */
function getClientIP(request: NextRequest): string {
  return request.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

/**
 * Adds a subscriber to MailerLite group
 * @param email - Email address to subscribe
 * @returns Promise with the API response
 */
async function addSubscriberToMailerLite(email: string) {
  try {
    logger.log('Attempting to add subscriber to MailerLite:', {
      email,
      groupId: MAILERLITE_GROUP_ID,
      apiUrl: MAILERLITE_API_URL
    })

    // Testează cu Group ID ca string în loc de number
    const requestBody = {
      email: email,
      groups: [MAILERLITE_GROUP_ID], // Fără parseInt
      status: 'active',
      // subscribed_at: new Date().toISOString(), // Comentează temporar
    }

    logger.log('Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    logger.log('MailerLite API response status:', response.status)
    logger.log('MailerLite API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        logger.error('Failed to parse error response:', parseError)
        errorData = { message: response.statusText }
      }
      
      logger.error('MailerLite API error response:', errorData)
      throw new Error(`MailerLite API error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    logger.log('MailerLite API success response:', result)
    return result
  } catch (error) {
    logger.error('MailerLite API error:', error)
    throw error
  }
}

/**
 * POST handler for newsletter subscription
 * Validates email, adds subscriber to MailerLite, and returns appropriate response
 */
export async function POST(request: NextRequest) {
  try {
    // Check if MailerLite configuration is set
    if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
      logger.error('MailerLite configuration missing:', {
        hasApiKey: !!MAILERLITE_API_KEY,
        hasGroupId: !!MAILERLITE_GROUP_ID
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Configurarea newsletter-ului nu este completă. Te rugăm să contactezi administratorul.' 
        },
        { status: 500 }
      )
    }

    // Check rate limiting
    const clientIP = getClientIP(request)
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Prea multe încercări. Te rugăm să încerci din nou în câteva minute.' 
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    logger.log('Request body:', body)
    const { email } = body
    logger.log('Extracted email:', email)

    // Validate email presence
    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Adresa de email este obligatorie' 
        },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Adresa de email nu este validă' 
        },
        { status: 400 }
      )
    }

    // Sanitize email (remove whitespace and convert to lowercase)
    const sanitizedEmail = email.trim().toLowerCase()

    // Add subscriber to MailerLite
    const result = await addSubscriberToMailerLite(sanitizedEmail)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Te-ai abonat cu succes la newsletter!',
      data: result
    })

  } catch (error) {
    logger.error('Newsletter subscription error:', error)
    
    // Handle specific MailerLite errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Această adresă de email este deja abonată la newsletter' 
          },
          { status: 409 }
        )
      }
      
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Adresa de email nu este validă' 
          },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'A apărut o eroare. Te rugăm să încerci din nou.' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - returns method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Metoda GET nu este permisă pentru acest endpoint' 
    },
    { status: 405 }
  )
}
