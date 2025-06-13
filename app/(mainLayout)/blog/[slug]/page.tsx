import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  ArrowLeft, 
  User,
  MessageSquare,
  BookOpen,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

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
            image: true
          }
        },
        comments: {
          where: { 
            approved: true,
            parentId: null
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            replies: {
              where: { approved: true },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!post || !post.published) {
      return null
    }

    // Get related posts
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        category: post.category,
        id: { not: post.id }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      take: 3,
      orderBy: { publishedAt: "desc" }
    })

    return { ...post, relatedPosts }
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
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback>
                      {post.author.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.author.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishedAt!).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} min read</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views.toLocaleString()} views</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes} likes</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  {/* Article Content */}
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }} />
                  </div>

                  <Separator className="my-8" />

                  {/* Article Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Like ({post.likes})
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {post.views.toLocaleString()} views
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Author Bio */}
              <Card className="mt-8 bg-gradient-to-r from-primary/5 to-background">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={post.author.image || ""} />
                      <AvatarFallback className="text-lg">
                        {post.author.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        Written by {post.author.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Career expert and content creator helping professionals advance their careers through AI-powered tools and strategic guidance.
                      </p>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              {post.comments.length > 0 && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments ({post.comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.author?.image || ""} />
                            <AvatarFallback>
                              {comment.author?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.author?.name || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                        
                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-8 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={reply.author?.image || ""} />
                                  <AvatarFallback className="text-xs">
                                    {reply.author?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs">
                                      {reply.author?.name || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
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
                    {post.relatedPosts.map((relatedPost) => (
                      <Link 
                        key={relatedPost.id} 
                        href={`/blog/${relatedPost.slug}`}
                        className="block group"
                      >
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
                      <Badge key={tag} variant="outline" className="text-xs hover:bg-primary/10 transition-colors cursor-pointer">
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
