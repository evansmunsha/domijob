import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "./app/utils/db"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the ref parameter from the URL
  const refCode = request.nextUrl.searchParams.get("ref")

  // Add cache control headers for better performance
  const response = NextResponse.next()

  // Set cache headers based on the path
  const path = request.nextUrl.pathname

  // Cache static pages longer
  if (path === "/" || path === "/jobs" || path === "/companies") {
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400")
  }

  // Cache job and company pages
  if (path.startsWith("/job/") || path.startsWith("/companies/")) {
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=600, stale-while-revalidate=3600")
  }

  // If no ref code, just continue with the response
  if (!refCode) {
    return response
  }

  try {
    // Check if affiliate code is valid
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: refCode },
    })

    if (!affiliate) {
      return response
    }

    // Track click
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        referrer: request.headers.get("referer") || "unknown",
        landingPage: request.nextUrl.pathname,
        source: request.headers.get("utm_source") || null,
        campaign: request.headers.get("utm_campaign") || null,
      },
    })

    // Update affiliate click count
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { clickCount: { increment: 1 } },
    })

    // Set the affiliate cookie
    // Set cookie to expire in 30 days
    response.cookies.set("affiliate_code", refCode, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Affiliate tracking error:", error)
    // Continue without tracking on error
    return response
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
