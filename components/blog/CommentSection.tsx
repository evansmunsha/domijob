"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Reply, Send, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import type { BlogComment } from "@/types/blog"

interface CommentSectionProps {
  postId: string
  comments: BlogComment[]
}

export function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<BlogComment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!session?.user) {
      toast.error("Please sign in to comment")
      return
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("🚀 Submitting comment to:", `/api/blog/posts/by-id/${postId}/comments`)

      const response = await fetch(`/api/blog/posts/by-id/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const newCommentData = await response.json()
      console.log("✅ Comment created:", newCommentData.id)

      // Add the new comment to the list (it will be pending approval)
      setComments((prev) => [newCommentData, ...prev])
      setNewComment("")

      toast.success("Comment submitted! It will appear after approval.")
    } catch (error) {
      console.error("❌ Error submitting comment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user) {
      toast.error("Please sign in to reply")
      return
    }

    if (!replyContent.trim()) {
      toast.error("Please enter a reply")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("🚀 Submitting reply to:", `/api/blog/posts/by-id/${postId}/comments`)

      const response = await fetch(`/api/blog/posts/by-id/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const newReply = await response.json()
      console.log("✅ Reply created:", newReply.id)

      // Add the reply to the parent comment
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: [...comment.replies, newReply],
              }
            : comment,
        ),
      )

      setReplyContent("")
      setReplyingTo(null)

      toast.success("Reply submitted! It will appear after approval.")
    } catch (error) {
      console.error("❌ Error submitting reply:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit reply")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div id="comments-section" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          {session?.user ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{newComment.length}/1000 characters</span>
                    <Button onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground mb-3">Sign in to join the conversation</p>
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  {/* Main Comment */}
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author?.image || ""} />
                      <AvatarFallback>{comment.author?.name?.charAt(0) || "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.author?.name || "Anonymous"}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(comment.createdAt)}
                        </div>
                        {!comment.approved && (
                          <Badge variant="secondary" className="text-xs">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        {session?.user && comment.approved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs h-7"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 ml-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={session?.user?.image || ""} />
                              <AvatarFallback className="text-xs">
                                {session?.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder={`Reply to ${comment.author?.name}...`}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[80px] resize-none text-sm"
                                maxLength={1000}
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{replyContent.length}/1000</span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(null)
                                      setReplyContent("")
                                    }}
                                    className="text-xs h-7"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={isSubmitting || !replyContent.trim()}
                                    className="text-xs h-7"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3 mr-1" />
                                    )}
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={reply.author?.image || ""} />
                            <AvatarFallback className="text-xs">{reply.author?.name?.charAt(0) || "A"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{reply.author?.name || "Anonymous"}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(reply.createdAt)}
                              </div>
                              {!reply.approved && (
                                <Badge variant="secondary" className="text-xs">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {comment !== comments[comments.length - 1] && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">No comments yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
