// File: /app/api/affiliate/track/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Change if your prisma path is different
import { prisma } from '@/app/utils/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const affiliateCode = searchParams.get('ref');

  // ✅ 1. Make sure ?ref= is provided
  if (!affiliateCode) {
    return NextResponse.json({ message: 'Missing affiliate code in URL' }, { status: 400 });
  }

  // ✅ 2. Find the affiliate by code
  const affiliate = await prisma.affiliate.findUnique({
    where: { code: affiliateCode },
  });

  if (!affiliate) {
    return NextResponse.json({ message: 'Invalid affiliate code' }, { status: 404 });
  }

  // ✅ 3. Get some metadata from request headers
  const headers = new Headers(request.headers);
  const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';
  const referrer = headers.get('referer') || 'direct';
  const landingPage = request.url;

  // ✅ 4. Store the click in the DB
  await prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      ipAddress,
      userAgent,
      referrer,
      landingPage,
      source: searchParams.get('source') || undefined,
      campaign: searchParams.get('campaign') || undefined,
    },
  });

  // ✅ 5. Increment click count on Affiliate
  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: {
      clickCount: { increment: 1 },
    },
  });

  // ✅ 6. Set a cookie to remember the referral
  (await
    // ✅ 6. Set a cookie to remember the referral
    cookies()).set('affiliate_ref', affiliate.code, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return NextResponse.json({ success: true, message: 'Affiliate click tracked' });
}
