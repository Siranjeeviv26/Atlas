import type { NextConfig } from 'next'

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000'

/**
 * The browser always talks to same-origin `/api/*`; Next proxies those to the
 * Hapi API so cookies stay first-party and CORS never comes into play.
 * Set NEXT_PUBLIC_API_URL to call a remote API directly instead.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) return []
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
