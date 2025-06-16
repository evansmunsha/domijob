"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Check,
  X,
  MessageSquare,
  User,
  Calendar,
  ExternalLink,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { CommentActions } from "./CommentActions"
import { BlogComment } from "@/types/blog"

export default function CommentsAdminPage() {
  const { data: session, status } = useSession()
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user || session.user.userType !== "ADMIN") {
      redirect("/login")
    }

    fetchComments()
  }, [session, status])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test/admin-comments")
      
      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }
      
      const data = await response.json()
      setComments(data.fullQuery ? data.fullQuery.comments || [] : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comments")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Comment Management</h1>
          <p className="text-muted-foreground">
            Review and manage blog post comments
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading comments...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Comment Management</h1>
          <p className="text-muted-foreground">
            Review and manage blog post comments
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchComments} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Comment Management</h1>
        <p className="text-muted-foreground">
          Review and manage blog post comments
        </p>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Comments: {comments.length}</p>
          <p>Approved: {comments.filter(c => c.approved).length}</p>
          <p>Pending: {comments.filter(c => !c.approved).length}</p>
          <p>User Type: {session?.user?.userType}</p>
          <p>User ID: {session?.user?.id}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
            <p className="text-xs text-muted-foreground">
              {comments.filter(c => c.approved).length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Badge variant="outline" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comments.filter(c => !c.approved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comments.reduce((sum, comment) => sum + (comment._count?.replies ?? 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>
            Review and manage blog post comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-4">
                {/* Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comment.author?.name || "Anonymous"}
                        </span>
                        <Badge variant={comment.approved ? "default" : "secondary"}>
                          {comment.approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>
                            {comment._count?.replies ?? 0} {comment._count?.replies === 1 ? "reply" : "replies"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/blog/${comment.post?.slug ?? ''}#comments-section`} target="_blank">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Post
                        </Link>
                      </Button>
                      <CommentActions comment={comment} />
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-sm leading-relaxed">
                  {comment.content}
                </p>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="border-l-2 pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {reply.author?.name || "Anonymous"}
                          </span>
                          <Badge variant={reply.approved ? "default" : "secondary"} className="text-xs">
                            {reply.approved ? "Approved" : "Pending"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {reply.content}
                        </p>
                        <div className="mt-2">
                          <CommentActions comment={reply} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">No comments yet</h3>
                <p className="text-sm text-muted-foreground">
                  Comments will appear here once users start engaging with your blog posts
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 