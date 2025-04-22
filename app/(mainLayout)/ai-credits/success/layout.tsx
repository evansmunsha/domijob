import React from "react";
import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { getUserCreditBalance } from "@/app/actions/aiCredits";
import { SuccessPageWrapper } from "./wrapper";

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

  // Define the props object to pass to the page
  const pageProps = { creditsBalance };

  // Pass the props to the page using a wrapper component
  return <SuccessPageWrapper pageProps={pageProps}>{children}</SuccessPageWrapper>;
} 