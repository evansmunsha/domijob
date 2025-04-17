import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

type SearchParams = {
  ref?: string;
}

type PageProps = {
  searchParams: SearchParams
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const session = await auth()

  if (session?.user) {
    redirect("/onboarding")
  }

  const redirectUrl = searchParams.ref 
    ? `/login?register=true&ref=${searchParams.ref}`
    : "/login?register=true"

  redirect(redirectUrl)
}
