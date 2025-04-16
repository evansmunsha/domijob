import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export default async function RegisterPage({ searchParams }: { searchParams: { ref?: string } }) {
  // Check if user is already logged in
  const session = await auth()
  if (session?.user) {
    redirect("/onboarding")
  }

  // Get referral code and preserve it when redirecting
  const refCode = searchParams.ref || ""
  const redirectUrl = refCode 
    ? `/login?register=true&ref=${refCode}`
    : "/login?register=true"

  // Redirect to login page with register flag
  redirect(redirectUrl)
} 