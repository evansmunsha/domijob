import type { DefaultSession } from "next-auth"
import type { UserType } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      stripeCustomerId?: string | null
      userType?: UserType | "COMPANY" | "JOB_SEEKER" | null
      companyId?: string | null
      referredByCode?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    userType?: UserType | "COMPANY" | "JOB_SEEKER"
    companyId?: string
    referredByCode?: string | null
    stripeCustomerId?: string | null
  }
}
