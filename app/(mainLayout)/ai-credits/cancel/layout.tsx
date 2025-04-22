import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Purchase Cancelled",
  description: "Your AI credits purchase was cancelled",
};

export default async function AICreditsCancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  return <>{children}</>;
} 