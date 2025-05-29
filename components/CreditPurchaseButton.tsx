"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

type Props = {
  packageId: string
  variant?: "default" | "outline"
}

export default function CreditPurchaseButton({ packageId, variant = "default" }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai-credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })

      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url // Redirect to Stripe checkout
      } else {
        alert(data.error || "Failed to redirect to checkout.")
      }
    } catch (err) {
      console.error("Error purchasing credits:", err)
      alert("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} className="w-full" variant={variant} disabled={loading}>
      {loading ? "Redirecting..." : "Purchase"}
    </Button>
  )
}
