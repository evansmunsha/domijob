import type { DefaultSession } from "next-auth"
import type { UserType } from "@prisma/client"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
    name?: string | null
    email?: string | null
    image?: string | null
    stripeCustomerId?: string | null
    userType?: string | null
    companyId?: string | null
    } & DefaultSession["user"]
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    /** The user's type (COMPANY or JOB_SEEKER) */
    userType?: UserType
    /** The company ID if the user is a company */
    companyId?: string
  }
}
