import React from "react";
import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { getUserCreditBalance } from "@/app/actions/aiCredits";

export const metadata: Metadata = {
  title: "Purchase Successful",
  description: "Your AI credits purchase was successful",
};

// Create context for credit balance
export const SuccessCreditBalanceContext = React.createContext<number>(0);

export default async function AICreditsSuccessLayout({
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
    <SuccessCreditBalanceContext.Provider value={creditsBalance}>
      {children}
    </SuccessCreditBalanceContext.Provider>
  );
} 