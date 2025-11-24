/**
 * Validates environment variables at application startup
 * JavaScript version for use in next.config.mjs
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
];

const OPTIONAL_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'MAILERLITE_API_KEY',
  'MAILERLITE_GROUP_ID',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'ADMIN_EMAILS',
];

/**
 * Validates that all required environment variables are set
 * @returns Validation result with missing variables and warnings
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(varName);
    }
  }

  // Validate Supabase URL format if present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates environment variables and throws if required ones are missing
 * Call this at application startup
 * @throws Error if required environment variables are missing
 */
function validateEnvOrThrow() {
  const result = validateEnv();

  if (!result.valid) {
    const missingList = result.missing.join(', ');
    throw new Error(
      `Missing required environment variables: ${missingList}\n` +
      `Please check your .env file or environment configuration.\n` +
      `See DEPLOYMENT-GUIDE.md for more information.`
    );
  }

  // Log warnings in development
  if (process.env.NODE_ENV === 'development' && result.warnings.length > 0) {
    console.warn(
      '⚠️  Optional environment variables not set:',
      result.warnings.join(', ')
    );
    console.warn(
      'Some features may not work correctly without these variables.'
    );
  }
}

export { validateEnv, validateEnvOrThrow };

