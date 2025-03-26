import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import Google from "next-auth/providers/google";


 

// Import your authentication providers here

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub, Google],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.userType = user.userType

        if (user.userType === "COMPANY") {
          const company = await prisma.company.findUnique({
            where: { userId: user.id },
            select: { id: true },
          })
          if (company) {
            session.user.companyId = company.id
          }
        }
      }
      return session
    },
  },
  // ... other NextAuth options
})


