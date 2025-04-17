import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

interface PageProps {
  searchParams?: {
    ref?: string
  }
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const session = await auth()

  if (session?.user) {
    redirect("/onboarding")
  }

  const ref = searchParams?.ref
  const redirectUrl = ref
    ? `/login?register=true&ref=${ref}`
    : "/login?register=true"

  redirect(redirectUrl)
}
