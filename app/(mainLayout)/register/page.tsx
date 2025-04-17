import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"

export const metadata: Metadata = {
  title: "Register | DoMiJob",
  description: "Create a new account on DoMiJob",
}

export const dynamic = "force-dynamic"; // This is important!

type Props = {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const session = await auth()

  if (session?.user) {
    redirect("/onboarding")
  }

  const refCode = typeof searchParams.ref === 'string' ? searchParams.ref : undefined;
  
  const redirectUrl = refCode
    ? `/login?register=true&ref=${refCode}`
    : "/login?register=true"

  redirect(redirectUrl)
}
