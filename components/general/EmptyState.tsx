import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode // Make it optional with React.ReactNode type
  buttonText?: string
  href?: string
}

export function EmptyState({ title, description, icon, buttonText, href }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 my-8">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {buttonText && href && (
        <Button asChild>
          <Link href={href}>{buttonText}</Link>
        </Button>
      )}
    </div>
  )
}

