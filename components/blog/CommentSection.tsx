"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  MessageSquare, 
  Send, 
  Reply,
  Loader2,
  User
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  } | null
  replies: Comment[]
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
}

export function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment("")
        toast.success("Comment submitted! It will appear after approval.")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to submit comment")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("Something went wrong")
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
      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (response.ok) {
        const reply = await response.json()
        setComments(prev => 
          prev.map(comment => 
            comment.id === parentId 
              ? { ...comment, replies: [...comment.replies, reply] }
              : comment
          )
        )
        setReplyContent("")
        setReplyTo(null)
        toast.success("Reply submitted! It will appear after approval.")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to submit reply")
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
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
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="min-h-[100px] resize-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Comments are moderated and will appear after approval.
                    </p>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !newComment.trim()}
                      size="sm"
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground mb-3">
                  Sign in to join the conversation
                </p>
                <Button asChild>
                  <Link href="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  {/* Main Comment */}
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author?.image || ""} />
                      <AvatarFallback>
                        {comment.author?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.author?.name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {comment.content}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyTo === comment.id && session?.user && (
                    <div className="ml-11 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={session.user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {session.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[80px] resize-none text-sm"
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={isSubmitting || !replyContent.trim()}
                              size="sm"
                              className="gap-2"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Reply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyTo(null)
                                setReplyContent("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={reply.author?.image || ""} />
                            <AvatarFallback className="text-xs">
                              {reply.author?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">
                                {reply.author?.name || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
