/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io', 'avatar.vercel.sh'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig