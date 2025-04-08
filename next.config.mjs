/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['avatar.vercel.sh', 'lh3.googleusercontent.com'],
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
                script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: blob: https://*;
                font-src 'self';
                object-src 'none';
                worker-src 'self' blob:;
                connect-src 'self' https://*;
                frame-src 'self';
              `.replace(/\s{2,}/g, ' ').trim()
            }
          ],
        },
      ]
    },
  }
  
  export default nextConfig
  