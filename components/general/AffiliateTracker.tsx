"use client"

import { useEffect } from "react"

export function AffiliateTracker({ refCode }: { refCode: string }) {
  useEffect(() => {
    if (!refCode) return

    fetch(`/api/affiliate/track?ref=${refCode}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Affiliate tracked:", data)
      })
      .catch((err) => {
        console.error("Affiliate tracking failed:", err)
      })
  }, [refCode])

  return null
}
