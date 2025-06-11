"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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
        toast({
          title: "Redirecting to checkout...",
          description: "You'll be taken to Stripe to complete your purchase.",
        })
        window.location.href = data.url
      } else {
        toast({
          variant: "destructive",
          title: "Checkout failed",
          description: data.error || "Unable to start checkout. Please try again.",
        })
      }
    } catch (err) {
      console.error("Error purchasing credits:", err)
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please check your connection or try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="w-full"
      variant={variant}
      disabled={loading}
      aria-busy={loading}
      aria-live="polite"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" /> Redirecting...
        </span>
      ) : (
        "Purchase"
      )}
    </Button>
  )
}
