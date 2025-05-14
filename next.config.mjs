/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['avatar.vercel.sh', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: `
                default-src 'self';
                script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://*.vercel-analytics.com https://*.googletagmanager.com;
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: blob: https://* https://*.googleusercontent.com;
                font-src 'self';
                object-src 'none';
                worker-src 'self' blob:;
                connect-src 'self' https://* wss://*;
                frame-src 'self';
              `.replace(/\s{2,}/g, ' ').trim()
            },
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin'
            },
            
          ],
        },{
        // Cache static assets for a longer time
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for a longer time
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
      ]
    },
  }
  
 
