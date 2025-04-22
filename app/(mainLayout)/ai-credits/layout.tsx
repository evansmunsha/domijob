import React from "react";
import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { getUserCreditBalance } from "@/app/actions/aiCredits";

export const metadata: Metadata = {
  title: "AI Credits",
  description: "Purchase AI credits to use premium AI features",
};

// Create context for credit balance
export const CreditBalanceContext = React.createContext<number>(0);

export default async function AICreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  const creditsBalance = await getUserCreditBalance();

  return (
    <CreditBalanceContext.Provider value={creditsBalance}>
      {children}
    </CreditBalanceContext.Provider>
  );
} 