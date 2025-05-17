import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { cookies } from "next/headers";
import { addFreeSignupCredits } from "@/app/actions/aiCredits"; // ✅ Add this

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.userType = user.userType;

        if (user.userType === "COMPANY") {
          const company = await prisma.company.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          if (company) {
            session.user.companyId = company.id;
          }
        }
      }
      return session;
    },
    async signIn({ user }) {
      try {
        const cookieStore = cookies();
        const affiliateCode = (await cookieStore).get("affiliate_code")?.value;

        if (affiliateCode && user.id) {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { referredByCode: true },
          });

          if (affiliateCode && existingUser?.referredByCode === null) {
            await prisma.user.update({
              where: { id: user.id },
              data: { referredByCode: affiliateCode },
            });
          }
        }
      } catch (error) {
        console.error("Error storing affiliate code:", error);
      }

      return true;
    },
  },

  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        await addFreeSignupCredits(user.id);
      } else {
        console.warn("User ID is undefined in createUser event");
      }
    },
  },
  

})

