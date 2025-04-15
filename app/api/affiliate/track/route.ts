import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { headers } from "next/headers"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const source = url.searchParams.get("source")
    const campaign = url.searchParams.get("campaign")
    const landingPage = url.searchParams.get("landing") || "/"

    if (!code) {
      return NextResponse.json({ error: "Affiliate code is required" }, { status: 400 })
    }

    // Get affiliate by code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code },
      select: { id: true }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 404 })
    }

    // Get request details
    const headersList = headers()
    const ipAddress = (await headersList).get("x-forwarded-for") || "unknown"
    const userAgent = (await headersList).get("user-agent") || "unknown"
    const referrer = (await headersList).get("referer") || "direct"

    // Record the click
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referrer,
        landingPage,
        source: source || "direct",
        campaign: campaign || null
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

    // Set cookie for 30 days
    const response = NextResponse.redirect(new URL(landingPage, req.url))
    response.cookies.set("affiliate_code", code, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: true,
      sameSite: "lax"
    })

    return response
  } catch (error) {
    console.error("[AFFILIATE_TRACK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 