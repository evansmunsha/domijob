import React from "react";
import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { getUserCreditBalance } from "@/app/actions/aiCredits";
import { SuccessCreditBalanceContext } from "./credit-context";

// Metadata should only be consumed by the Next.js framework
export const metadata: Metadata = {
  title: "Purchase Successful",
  description: "Your AI credits purchase was successful",
};

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