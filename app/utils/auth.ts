// app/utils/auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { addFreeSignupCredits } from "../actions/aiCredits";

// Constants for anonymous credits
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
  GitHub({
    clientId: process.env.GITHUB_ID as string,
    clientSecret: process.env.GITHUB_SECRET as string,
    profile(profile) {
      return {
        id: profile.id.toString(), // important!
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
  }),
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    profile(profile) {
      return {
        id: profile.sub, // this is key
        name: profile.given_name || profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
    // Optional, enable this if you want to auto-link accounts (with caution)
    allowDangerousEmailAccountLinking: true,
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
      if (!user.id) {
        console.warn("User ID is undefined in createUser event");
        return;
      }
  
      try {
        // 1. Check for anonymous credits in cookie
        const cookieStore = await cookies();
        const guestCreditCookie = cookieStore.get(GUEST_CREDIT_COOKIE);
        let guestCredits = 0;
        
        if (guestCreditCookie) {
          const parsedCredits = parseInt(guestCreditCookie.value);
          if (!isNaN(parsedCredits) && parsedCredits > 0) {
            guestCredits = parsedCredits;
            
            // Log the transfer of guest credits if you have a transaction table
            try {
              await prisma.creditTransaction.create({
                data: {
                  userId: user.id,
                  amount: guestCredits,
                  type: "guest_transfer",
                  description: `Transferred ${guestCredits} remaining guest credits`,
                }
              });
            } catch (error) {
              // If creditTransaction table doesn't exist, just continue
              console.log("Note: Guest credit transfer logging skipped");
            }
            
            // Clear the guest credits cookie
            cookieStore.set(GUEST_CREDIT_COOKIE, "", {
              path: "/",
              maxAge: 0, // Expire immediately
            });
          }
        }
        
        // 2. Give free signup credits (plus any guest credits)
        await addFreeSignupCredits(user.id, guestCredits);
  
        // 3. Check if user was referred
        const referredUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { referredByCode: true }
        });
  
        if (!referredUser?.referredByCode) return;
  
        // 4. Find the affiliate
        const affiliate = await prisma.affiliate.findUnique({
          where: { code: referredUser.referredByCode }
        });
  
        if (!affiliate) return;
  
        // 5. Create the referral record
        await prisma.affiliateReferral.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: user.id,
            status: "PENDING",
            commissionAmount: 0, // Initial amount
          }
        });
  
      } catch (error) {
        console.error("Error in createUser event:", error);
      }
    },
  }
});

