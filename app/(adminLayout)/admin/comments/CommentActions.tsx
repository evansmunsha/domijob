"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"
import type { BlogComment } from "@/types/blog"

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
          action: action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update comment")
      }

      const updatedComment = await response.json()

      toast.success(`Comment ${action === "approve" ? "approved" : "rejected"} successfully!`)

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update comment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {!comment.approved && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("approve")}
          disabled={isLoading}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("reject")}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        {comment.approved ? "Unapprove" : "Reject"}
      </Button>
    </div>
  )
}
