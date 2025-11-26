/**
 * Validates environment variables at application startup
 * Throws errors if required variables are missing
 */

interface EnvValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_PARTYKIT_HOST',
] as const

const OPTIONAL_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'MAILERLITE_API_KEY',
  'MAILERLITE_GROUP_ID',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'ADMIN_EMAILS',
] as const

/**
 * Validates that all required environment variables are set
 * @returns Validation result with missing variables and warnings
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missing.push(varName)
    }
  }

  // Check optional but recommended variables
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      warnings.push(varName)
    }
  }

  // Validate Supabase URL format if present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should start with https://')
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Validates environment variables and throws if required ones are missing
 * Call this at application startup
 * @throws Error if required environment variables are missing
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv()

  if (!result.valid) {
    const missingList = result.missing.join(', ')
    throw new Error(
      `Missing required environment variables: ${missingList}\n` +
      `Please check your .env file or environment configuration.\n` +
      `See DEPLOYMENT-GUIDE.md for more information.`
    )
  }

  // Log warnings in development
  if (process.env.NODE_ENV === 'development' && result.warnings.length > 0) {
    console.warn(
      '⚠️  Optional environment variables not set:',
      result.warnings.join(', ')
    )
    console.warn(
      'Some features may not work correctly without these variables.'
    )
  }
}

/**
 * Gets environment variable value or throws if missing
 * @param varName - Environment variable name
 * @param required - Whether the variable is required (default: true)
 * @returns Environment variable value
 * @throws Error if required variable is missing
 */
export function getEnvVar(varName: string, required = true): string {
  const value = process.env[varName]

  if (required && (!value || value.trim() === '')) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }

  return value || ''
}

