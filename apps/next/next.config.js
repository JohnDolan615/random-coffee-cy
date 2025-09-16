/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    BOT_TOKEN: process.env.BOT_TOKEN,
    APP_URL: process.env.APP_URL,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip pre-rendering of API routes that need database access
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['apps/next/app', 'apps/next/src'],
    // Allow production builds to successfully complete even if ESLint has errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig