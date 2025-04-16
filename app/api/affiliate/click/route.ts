import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get the affiliate code from the request
    const { affiliateCode } = await request.json()
    
    if (!affiliateCode) {
      return NextResponse.json({ error: "No affiliate code provided" }, { status: 400 })
    }

    // Verify the affiliate code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 404 })
    }

    // Get request metadata
    const headers = request.headers
    const userAgent = headers.get('user-agent') || 'unknown'
    const referer = headers.get('referer') || 'unknown'
    const ipAddress = headers.get('x-forwarded-for') || 'unknown'
    
    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent,
        referrer: referer,
        landingPage: headers.get('origin') || '/',
        source: headers.get('utm_source') || null,
        campaign: headers.get('utm_campaign') || null,
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

    // Set the affiliate cookie in the response
    const response = NextResponse.json({ success: true })
    
    // Set cookie to expire in 30 days
    response.cookies.set('affiliate_code', affiliateCode, { 
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('[AFFILIATE_CLICK]', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 