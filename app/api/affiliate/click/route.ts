import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { cookies } from "next/headers"
import { headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const affiliateCode = (await cookies()).get("affiliate_code")?.value
    if (!affiliateCode) {
      return NextResponse.json({ error: "No affiliate code found" }, { status: 400 })
    }

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 404 })
    }

    // Get request data
    const headersList = headers()
    const userAgent = (await headersList).get("user-agent")
    const referrer = (await headersList).get("referer")
    const ipAddress = (await headersList).get("x-forwarded-for") || (await headersList).get("x-real-ip")

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referrer,
        landingPage: new URL(req.url).pathname,
        source: new URL(req.url).searchParams.get("source") || null,
        campaign: new URL(req.url).searchParams.get("campaign") || null
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

    return NextResponse.json({ message: "Click recorded successfully" })
  } catch (error) {
    console.error("[AFFILIATE_CLICK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 