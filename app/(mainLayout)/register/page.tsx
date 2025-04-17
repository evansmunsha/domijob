import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export const dynamic = "force-dynamic"

// Next.js provides searchParams as a separate prop
export default async function RegisterPage({ 
  searchParams 
}: {
  // Use minimal/simple type definitions
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Check if user is already logged in
  const session = await auth()
  if (session?.user) {
    redirect("/onboarding")
  }

  // Build redirect URL with ref parameter if it exists
  let redirectUrl = "/login?register=true"
  
  // Safely access ref parameter
  const ref = typeof searchParams.ref === 'string' ? searchParams.ref : undefined
  if (ref) {
    redirectUrl += `&ref=${ref}`
  }
  
  redirect(redirectUrl)
}
