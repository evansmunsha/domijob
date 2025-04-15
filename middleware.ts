import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from "@/app/utils/db"

export async function middleware(request: NextRequest) {
  // Continue if this is an API route
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for ref query parameter (affiliate code)
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref) {
    try {
      // Find the affiliate
      const affiliate = await prisma.affiliate.findUnique({
        where: { code: ref },
        select: { id: true }
      })

      if (affiliate) {
        // Record click if affiliate exists
        const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const referrer = request.headers.get('referer') || 'direct'
        const landingPage = request.nextUrl.pathname

        await prisma.affiliateClick.create({
          data: {
            affiliateId: affiliate.id,
            ipAddress,
            userAgent,
            referrer,
            landingPage,
            source: request.nextUrl.searchParams.get('source') || 'direct',
            campaign: request.nextUrl.searchParams.get('campaign') || null
          }
        })

        // Update affiliate click count
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: {
            clickCount: {
              increment: 1
            }
          }
        })

        // Set cookie and redirect to the same URL without ref parameter
        const url = new URL(request.nextUrl)
        url.searchParams.delete('ref')
        
        const response = NextResponse.redirect(url)
        
        // Set cookie for 30 days
        response.cookies.set('affiliate_code', ref, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        })
        
        return response
      }
    } catch (error) {
      console.error('[AFFILIATE_MIDDLEWARE]', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
} 