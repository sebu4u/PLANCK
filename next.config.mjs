/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['i.ibb.co'],
  },
  // Optimizations for dev mode
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce file watching on Windows
    watchOptions: {
      poll: process.platform === 'win32' ? 1000 : false,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    },
  }),
  webpack: (config, { isServer, dev }) => {
    // Handle ES modules that need to be transpiled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Optimize for dev mode
    if (dev) {
      // Reduce rebuilds by ignoring certain files
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
        ],
      };
      
      // Optimize module resolution
      config.resolve.symlinks = false;
    }
    
    return config;
  },
  transpilePackages: ['function-plot', 'mathlive'],
}

export default nextConfig
