import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  description: string
  buttonText?: string
  href?: string
}

export function EmptyState({ title, description, buttonText, href }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50 dark:bg-muted">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
        <SearchX className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{description}</p>
      {buttonText && href && (
        <Button asChild>
          <Link href={href}>{buttonText}</Link>
        </Button>
      )}
    </div>
  )
}
