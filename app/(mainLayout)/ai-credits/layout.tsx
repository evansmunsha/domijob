import React from "react";
import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { getUserCreditBalance } from "@/app/actions/aiCredits";
import { CreditsPageWrapper } from "./wrapper";

export const metadata: Metadata = {
  title: "AI Credits",
  description: "Purchase AI credits to use premium AI features",
};

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

  // Define the props object to pass to the page
  const pageProps = { creditsBalance };

  // Pass the props to the page using a wrapper component
  return <CreditsPageWrapper pageProps={pageProps}>{children}</CreditsPageWrapper>;
} 