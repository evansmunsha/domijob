// @ts-nocheck
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export const dynamic = "force-dynamic"; // This is important!

export default async function RegisterPage(props) {
  // Check if user is already logged in
  const session = await auth()
  if (session?.user) {
    redirect("/onboarding")
  }

  // Get ref parameter and redirect
  const ref = props.searchParams?.ref
  const redirectUrl = ref ? `/login?register=true&ref=${ref}` : "/login?register=true"
  
  redirect(redirectUrl)
}
