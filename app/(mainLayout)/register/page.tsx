import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export const dynamic = "force-dynamic"; // This is important!

type SearchParams = { ref?: string };

export default async function RegisterPage({
  searchParams = {}
}: {
  searchParams?: SearchParams
}) {
  const session = await auth()

  if (session?.user) {
    redirect("/onboarding")
  }

  const refCode = searchParams.ref;
  
  const redirectUrl = refCode
    ? `/login?register=true&ref=${refCode}`
    : "/login?register=true"

  redirect(redirectUrl)
}
