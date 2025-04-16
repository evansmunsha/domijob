import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { cookies } from "next/headers"

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

  // Get referral code from either the URL param or existing cookie
  const refCodeFromURL = searchParams.ref
  const cookieStore = cookies()
  const refCodeFromCookie = cookieStore.get("affiliate_code")?.value
  
  // Use URL parameter if present, otherwise use the cookie value
  const refCode = refCodeFromURL || refCodeFromCookie
  
  // Save the referral code in a cookie if it came from the URL
  if (refCodeFromURL) {
    // Set in a cookie that will be passed to the login form
    cookieStore.set("affiliate_code", refCodeFromURL, { 
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })
  }

  // Redirect to login page with register flag
  const redirectUrl = "/login?register=true"
  redirect(redirectUrl)
} 