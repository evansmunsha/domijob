import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

type SearchParams = {
  ref?: string;
};

export default async function RegisterPage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  // Check if user is already logged in
  const session = await auth()
  if (session?.user) {
    redirect("/onboarding")
  }

  // Redirect to login page with register flag, preserving the ref parameter
  const redirectUrl = searchParams.ref 
    ? `/login?register=true&ref=${searchParams.ref}`
    : "/login?register=true"
    
  redirect(redirectUrl)
} 