"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref")

  useEffect(() => {
    const redirectUrl = ref
      ? `/login?register=true&ref=${ref}`
      : "/login?register=true"
    router.replace(redirectUrl)
  }, [ref, router])

  return null
}
