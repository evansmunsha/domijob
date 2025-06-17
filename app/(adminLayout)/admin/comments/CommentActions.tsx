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

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: action === 'approve'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Failed to update comment')
    } finally {
      setIsLoading(false)
    }
  }

  if (comment.approved) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('reject')}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Reject
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('approve')}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('reject')}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Reject
      </Button>
    </div>
  )
} 