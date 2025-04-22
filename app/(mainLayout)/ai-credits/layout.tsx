import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Credits",
  description: "Purchase AI credits to use premium AI features",
}

export default function AICreditsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 