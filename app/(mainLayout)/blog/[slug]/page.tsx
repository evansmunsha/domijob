import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Eye, Heart, ArrowLeft, User, BookOpen, TrendingUp } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { BlogInteractions } from "@/components/blog/BlogInteractions"
import { CommentSection } from "@/components/blog/CommentSection"
import ReactMarkdown from 'react-markdown'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

async function getBlogPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: { approved: true },
            },
          },
        },
        comments: {
          where: {
            approved: true,
            parentId: null,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            replies: {
              where: { approved: true },
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
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!post) {
      return null
    }

    // Don't show unpublished posts to non-admins
    const session = await auth()
    if (!post.published && (!session?.user || session.user.userType !== "ADMIN")) {
      return null
    }

    // Get related posts
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        category: post.category,
        id: { not: post.id },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    })

    // Check if current user liked this post
    let userLiked = false
    if (session?.user) {
      const existingLike = await prisma.blogLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: post.id,
          },
        },
      })
      userLiked = !!existingLike
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return {
      ...post,
      relatedPosts,
      userLiked,
    }
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return null
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            <div className="space-y-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {post.category}
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{post.title}</h1>

              <p className="text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback>{post.author.name?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.author.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{new Date(post.publishedAt!).toLocaleDateString()}</span>
                  <span className="sm:hidden">
                    {new Date(post.publishedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} min</span>
                </div>

                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span> {/* Use the likes field directly */}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  {/* Article Content */}
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>

                  <Separator className="my-8" />

                  {/* Interactive Features */}
                  <BlogInteractions
                    postId={post.id}
                    postTitle={post.title}
                    postUrl={`${process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"}/blog/${post.slug}`}
                    initialLikes={post.likes} // Use the likes field directly
                    initialComments={post._count.comments}
                    views={post.views}
                    initialUserLiked={post.userLiked}
                  />
                </CardContent>
              </Card>

              {/* Author Bio */}
              <Card className="mt-8 bg-gradient-to-r from-primary/5 to-background">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={post.author.image || ""} />
                      <AvatarFallback className="text-lg">{post.author.name?.charAt(0) || "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Written by {post.author.name}</h3>
                      <p className="text-muted-foreground mb-4">
                        Career expert and content creator helping professionals advance their careers through AI-powered
                        tools and strategic guidance.
                      </p>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <div className="mt-8">
                <CommentSection
                  postId={post.id}
                  comments={post.comments.map((comment: any) => ({
                    ...comment,
                    createdAt: comment.createdAt.toISOString(),
                    replies: comment.replies.map((reply: any) => ({
                      ...reply,
                      createdAt: reply.createdAt.toISOString(),
                      replies: [], // Replies don't have nested replies
                    })),
                  }))}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 order-1 lg:order-2 space-y-4 lg:space-y-6">
              {/* Newsletter Signup */}
              <NewsletterSignup variant="sidebar" source="blog_post" />

              {/* Related Posts */}
              {post.relatedPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Related Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {post.relatedPosts.map((relatedPost: any) => (
                      <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="block group">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{relatedPost.readTime} min</span>
                            <Eye className="h-3 w-3" />
                            <span>{relatedPost.views}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Popular Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["AI", "Resume", "Job Search", "Career", "Remote Work", "Interview"].map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
