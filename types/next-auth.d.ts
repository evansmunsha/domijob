import type { DefaultSession } from "next-auth"
import type { UserType } from "@prisma/client"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID. */
      id?: string
      /** The user's type (COMPANY or JOB_SEEKER) */
      userType?: UserType
      /** The company ID if the user is a company */
      companyId?: string
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

