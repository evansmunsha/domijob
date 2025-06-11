import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Purchase Successful",
  description: "Your AI credits purchase was successful",
}

export default function AICreditsSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 