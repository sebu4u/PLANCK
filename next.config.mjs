import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateEnvOrThrow } from './lib/env-validate.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  // Cursor opens the git parent (`PLANCK/`), which historically also had a stray
  // `app/` folder and `.pnpm-store`. Pin Turbopack to this Next app so it does
  // not watch the parent — that watcher loop is what makes `next dev` sit on
  // "Compiling..." after an IDE restart.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  experimental: {
    // Keep the on-disk Turbopack cache off. A stale `.next/dev` after Cursor is
    // killed is the usual reason localhost comes back stuck compiling.
    turbopackFileSystemCacheForDev: false,
  },
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
      {
        source: '/cursuri',
        destination: '/invata/cursuri',
        permanent: true,
      },
      {
        source: '/cursuri/:slug',
        destination: '/invata/cursuri/fizica/:slug',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
