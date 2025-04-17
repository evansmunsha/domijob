import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

// ✅ Use built-in Next.js types
export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: { ref?: string }
}) {
  const session = await auth()

  if (session?.user) {
    redirect("/onboarding")
  }

  const redirectUrl = searchParams?.ref
    ? `/login?register=true&ref=${searchParams.ref}`
    : "/login?register=true"

  redirect(redirectUrl)
}
