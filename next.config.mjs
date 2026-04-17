import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.solobeaute.com',
      },
      {
        protocol: 'https',
        hostname: 'api.solobeaute.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    // Conservative default: 1 day. Safe to raise to 31536000 once the
    // backend guarantees image URLs are immutable / content-addressed
    // (e.g. include a hash or version in the path).
    minimumCacheTTL: 86400,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
