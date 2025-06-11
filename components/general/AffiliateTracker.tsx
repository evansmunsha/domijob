"use client"

import { useEffect } from "react"

interface AffiliateTrackerProps {
  refCode: string
}

export function AffiliateTracker({ refCode }: AffiliateTrackerProps) {
  useEffect(() => {
    if (!refCode || typeof window === "undefined") return

    const alreadyTracked = localStorage.getItem(`tracked_referral_${refCode}`)
    if (alreadyTracked) return

    localStorage.setItem(`tracked_referral_${refCode}`, "true")

    // Send referral to backend
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ affiliateCode: refCode }) // ✅ Match your existing backend
    }).catch((err) => {
      console.error("Affiliate click tracking failed:", err)
    })
  }, [refCode])

  return null
}
