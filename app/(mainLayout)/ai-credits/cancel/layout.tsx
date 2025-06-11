import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Cancelled",
  description: "Your AI credits purchase was cancelled",
};

export default function AICreditsCancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 