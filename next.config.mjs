import { validateEnvOrThrow } from './lib/env-validate.mjs'

// Validate environment variables at build time
try {
  validateEnvOrThrow()
} catch (error) {
  console.error('❌ Environment validation failed:', error.message)
  // In production builds, we might want to fail the build
  // In development, we'll continue but warn
  if (process.env.NODE_ENV === 'production') {
    throw error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  transpilePackages: ['function-plot', 'mathlive'],
  async redirects() {
    return [
      {
        source: '/planckcode/learn',
        destination: '/planckcode',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
