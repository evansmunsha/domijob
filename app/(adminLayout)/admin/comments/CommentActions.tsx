"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"
import { BlogComment } from "@/types/blog"

interface CommentActionsProps {
  comment: BlogComment
}

export function CommentActions({ comment }: CommentActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: "approve" | "reject") => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/blog/comments/${comment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          action === "approve" 
            ? "Comment approved successfully" 
            : "Comment rejected successfully"
        )
        // Refresh the page to show updated state
        window.location.reload()
      } else {
        toast.error(data.error || `Failed to ${action} comment`)
      }
    } catch (error) {
      console.error(`Error ${action}ing comment:`, error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (comment.approved) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleAction("reject")}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3 mr-1" />
        )}
        Reject
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3 mr-1" />
        )}
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleAction("reject")}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3 mr-1" />
        )}
        Reject
      </Button>
    </div>
  )
} 