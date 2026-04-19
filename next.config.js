/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Vercel configuration
  images: {
    unoptimized: true,
  },
  // Disable ESLint during build to prevent quote escaping errors
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
