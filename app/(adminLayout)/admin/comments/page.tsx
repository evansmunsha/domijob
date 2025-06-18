import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare,
  Calendar,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { CommentActions } from "./CommentActions"
import { BlogComment } from "@/types/blog"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

function serializeComment(comment: any): BlogComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies: comment.replies.map(serializeComment)
  }
}

async function getComments(): Promise<BlogComment[]> {
  try {
    console.log("🔍 [getComments] Starting to fetch comments...")
    
    // Get all posts including unpublished ones
    const posts = await prisma.blogPost.findMany({
      include: {
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            },
            _count: {
              select: { replies: true }
            }
          },
          orderBy: [
            { approved: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    })

    // Log raw post data
    console.log("📦 Raw posts data:", JSON.stringify(posts, null, 2))
    
    // Check if we have any posts
    if (posts.length === 0) {
      console.warn("⚠️ No posts found in the database")
    } else {
      console.log(`✅ Found ${posts.length} posts`)
    }

    // Flatten comments from all posts
    const allComments = posts.flatMap(post => 
      post.comments.map(comment => ({
        ...comment,
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug
        }
      }))
    )

    console.log(`✅ [getComments] Found ${allComments.length} comments across ${posts.length} posts`)
    
    // Check if we have any comments
    if (allComments.length === 0) {
      console.warn("⚠️ No comments found in any posts")
      
      // Try direct comment query
      console.log("🔍 Attempting direct comment query...")
      const directComments = await prisma.blogComment.findMany({
        take: 5
      })
      console.log(`Direct query found ${directComments.length} comments`)
    }
    
    // Log some debug info
    allComments.forEach((comment, index) => {
      console.log(`📝 [getComments] Comment ${index + 1}:`, {
        id: comment.id,
        content: comment.content?.substring(0, 30) + "...",
        approved: comment.approved,
        author: comment.author ? `${comment.author.name} (${comment.author.email})` : 'No Author',
        post: comment.post?.title || "No Post",
        parentId: comment.parentId || 'None',
        replies: comment.replies?.length || 0,
        createdAt: comment.createdAt
      })
    })
    
    return allComments.map(serializeComment)
  } catch (error) {
    console.error("❌ [getComments] Error:", error)
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return []
  }
}

export default async function CommentsAdminPage() {
  let debugInfo = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    session: null as any,
    error: null as string | null,
    commentsCount: 0,
    dbStats: null as any,
    directCommentCheck: null as any
  }

  try {
    const session = await auth()
    debugInfo.session = {
      userId: session?.user?.id,
      userType: session?.user?.userType,
      email: session?.user?.email,
      isAdmin: session?.user?.userType === 'ADMIN'
    }

    if (!session?.user || session.user.userType !== "ADMIN") {
      debugInfo.error = 'Not an admin user'
      console.error('Access denied - not an admin')
      redirect("/login")
    }

    // Get database stats
    try {
      const [total, approved, pending] = await Promise.all([
        prisma.blogComment.count(),
        prisma.blogComment.count({ where: { approved: true }}),
        prisma.blogComment.count({ where: { approved: false }})
      ])
      
      debugInfo.dbStats = { total, approved, pending }
      debugInfo.commentsCount = total
      
      // Direct comment query
      if (total === 0) {
        const tableExists = await prisma.$queryRaw`SELECT to_regclass('public."BlogComment"') as exists`
        const samplePosts = await prisma.blogPost.findMany({ take: 3 })
        
        debugInfo.directCommentCheck = {
          tableExists: !!tableExists[0]?.exists,
          samplePosts: samplePosts.map(p => ({ id: p.id, title: p.title }))
        }
      }
    } catch (dbError) {
      console.error('Error getting DB stats:', dbError)
      debugInfo.error = 'Failed to get database stats'
    }

    const comments = await getComments()
    debugInfo.commentsCount = comments.length

    return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <summary className="font-medium cursor-pointer text-sm text-gray-600 dark:text-gray-300">Debug Information</summary>
        <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded text-xs overflow-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <a 
              href="/api/admin/debug/comments" 
              target="_blank" 
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              View Raw Comments Data (JSON)
            </a>
          </div>
        </div>
      </details>

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
          <p>Approved: {comments.filter((c: BlogComment) => c.approved).length}</p>
          <p>Pending: {comments.filter((c: BlogComment) => !c.approved).length}</p>
          <p>User Type: {session.user.userType}</p>
          <p>User ID: {session.user.id}</p>
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
              {comments.filter((c: BlogComment) => c.approved).length} approved
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
              {comments.filter((c: BlogComment) => !c.approved).length}
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
              {comments.reduce((sum: number, comment: BlogComment) => sum + (comment._count?.replies ?? 0), 0)}
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
            {comments.map((comment: BlogComment) => (
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
                    {comment.replies.map((reply: BlogComment) => (
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
} catch (error) {
  debugInfo.error = error instanceof Error ? error.message : 'Unknown error'
  console.error("❌ Error in CommentsAdminPage:", error)
  
  // Still render the page with error information
  return (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
        <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Comments</h2>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          An error occurred while loading comments. Showing debug information below.
        </p>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Debug Information</h3>
        <pre className="mt-2 p-3 bg-white dark:bg-gray-900 rounded text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
          <a 
            href="/api/admin/debug/comments" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Try viewing raw comments data
          </a>
        </div>
      </div>
    </div>
  )
}}