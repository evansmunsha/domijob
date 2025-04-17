
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export const dynamic = "force-dynamic"

// A simple function to handle redirection
export default async function RegisterPage(props: { searchParams?: { ref?: string } }) {
  // Check if user is already logged in
  const session = await auth()
  if (session?.user) {
    redirect("/onboarding")
  }

  // Build redirect URL with ref parameter if it exists
  let redirectUrl = "/login?register=true"
  
  // Safely access searchParams
  if (props?.searchParams?.ref) {
    redirectUrl += `&ref=${props.searchParams.ref}`
  }
  
  redirect(redirectUrl)
}
