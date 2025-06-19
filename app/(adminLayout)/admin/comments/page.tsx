import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { CommentActions } from "./CommentActions"
import type { BlogComment } from "@/types/blog"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

// Simplified serialization function
function serializeComment(comment: any): BlogComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies: comment.replies?.map(serializeComment) || [],
  }
}

async function getCommentsWithPosts(): Promise<BlogComment[]> {
  try {
    console.log("🔍 [getCommentsWithPosts] Starting to fetch comments...")

    // Direct query approach - get all comments with their post info
    const comments = await prisma.blogComment.findMany({
      where: {
        parentId: null, // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    })

    console.log(`✅ [getCommentsWithPosts] Found ${comments.length} comments`)

    // Log detailed info for debugging
    comments.forEach((comment, index) => {
      console.log(`📝 Comment ${index + 1}:`, {
        id: comment.id,
        content: comment.content?.substring(0, 50) + "...",
        approved: comment.approved,
        author: comment.author?.name || "Anonymous",
        post: comment.post?.title || "No Post",
        replies: comment.replies?.length || 0,
      })
    })

    return comments.map(serializeComment)
  } catch (error) {
    console.error("❌ [getCommentsWithPosts] Error:", error)
    return []
  }
}

export default async function CommentsAdminPage() {
  console.log("🚀 CommentsAdminPage component starting...")

  try {
    // Check authentication first
    const session = await auth()
    console.log("🔐 Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userType: session?.user?.userType,
      userId: session?.user?.id,
    })

    if (!session?.user || session.user.userType !== "ADMIN") {
      console.log("❌ Access denied - redirecting to login")
      redirect("/login")
    }

    console.log("✅ User is admin, proceeding to fetch comments...")

    // Get comments
    const comments = await getCommentsWithPosts()
    console.log(`✅ Retrieved ${comments.length} comments for display`)

    // Calculate stats
    const stats = {
      total: comments.length,
      approved: comments.filter((c) => c.approved).length,
      pending: comments.filter((c) => !c.approved).length,
      totalReplies: comments.reduce((sum, comment) => sum + (comment._count?.replies ?? 0), 0),
    }

    console.log("📊 Stats:", stats)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Comment Management</h1>
          <p className="text-muted-foreground">Review and manage blog post comments</p>
        </div>

        {/* Debug Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Session User:</strong> {session.user.name} ({session.user.userType})
            </p>
            <p>
              <strong>Total Comments:</strong> {stats.total}
            </p>
            <p>
              <strong>Approved:</strong> {stats.approved}
            </p>
            <p>
              <strong>Pending:</strong> {stats.pending}
            </p>
            <p>
              <strong>Total Replies:</strong> {stats.totalReplies}
            </p>
            <p>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </p>
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
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.approved} approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Badge variant="outline" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReplies}</div>
              <p className="text-xs text-muted-foreground">Across all comments</p>
            </CardContent>
          </Card>
        </div>

        {/* Comments List */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({comments.length})</CardTitle>
            <CardDescription>Review and manage blog post comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment: BlogComment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-4">
                    {/* Comment Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author?.name || "Anonymous"}</span>
                            <Badge variant={comment.approved ? "default" : "secondary"}>
                              {comment.approved ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>
                                {comment._count?.replies ?? 0} {comment._count?.replies === 1 ? "reply" : "replies"}
                              </span>
                            </div>
                            {comment.post && (
                              <div className="text-blue-600 dark:text-blue-400">Post: {comment.post.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comment.post && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/blog/${comment.post.slug}#comments-section`} target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Post
                              </Link>
                            </Button>
                          )}
                          <CommentActions comment={comment} />
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded">{comment.content}</p>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Replies ({comment.replies.length})
                        </h4>
                        {comment.replies.map((reply: BlogComment) => (
                          <div key={reply.id} className="border-l-2 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{reply.author?.name || "Anonymous"}</span>
                              <Badge variant={reply.approved ? "default" : "secondary"} className="text-xs">
                                {reply.approved ? "Approved" : "Pending"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{reply.content}</p>
                            <div className="mt-2">
                              <CommentActions comment={reply} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">No comments found</h3>
                  <p className="text-sm text-muted-foreground">
                    Comments will appear here once users start engaging with your blog posts
                  </p>
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Debug:</strong> Check the database directly or try the test endpoints:
                    </p>
                    <div className="mt-2 space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/api/test/comments" target="_blank">
                          Test Comments API
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/api/test/admin-comments" target="_blank">
                          Test Admin Comments API
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("❌ Error in CommentsAdminPage:", error)

    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Comments</h2>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <div className="mt-4 space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/api/test/comments" target="_blank">
                Test Comments API
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/test/admin-comments" target="_blank">
                Test Admin Comments API
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
