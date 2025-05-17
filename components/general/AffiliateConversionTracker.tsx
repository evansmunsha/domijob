"use client"

import { useEffect } from "react"

export function AffiliateConversionTracker() {
  useEffect(() => {
    const hasConverted = localStorage.getItem("affiliate_conversion_done")

    if (!hasConverted) {
      fetch("/api/affiliate/convert", {
        method: "POST",
      }).then(() => {
        localStorage.setItem("affiliate_conversion_done", "true")
      }).catch((err) => {
        console.error("Conversion tracking failed", err)
      })
    }
  }, [])

  return null
}
