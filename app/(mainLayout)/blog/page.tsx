import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, ArrowRight, User, Search, TrendingUp, BookOpen, Eye, Heart } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

async function getBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
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
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 20,
  })

  return posts
}

async function getBlogStats() {
  const [totalPosts, totalViews, categories] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.aggregate({
      where: { published: true },
      _sum: { views: true },
    }),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true },
      _count: true,
      orderBy: { _count: { category: "desc" } },
    }),
  ])

  return {
    totalPosts,
    totalViews: totalViews._sum.views || 0,
    categories,
  }
}

export default async function BlogPage() {
  const [posts, stats] = await Promise.all([getBlogPosts(), getBlogStats()])

  const featuredPost = posts.find((post) => post.featured)
  const otherPosts = posts.filter((post) => !post.featured)

  // If no posts exist, show empty state
  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Blog Coming Soon!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              We're working on creating amazing content to help accelerate your career. Check back soon for expert tips,
              industry insights, and career guidance.
            </p>
            <div className="space-y-4">
              <p className="text-muted-foreground">In the meantime, try our AI-powered tools:</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/ai-tools/resume-enhancer">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Enhance Your Resume
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/jobs">
                    <Search className="h-4 w-4 mr-2" />
                    Find Jobs
                  </Link>
                </Button>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Get Notified When We Launch</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to read our career insights and job search tips
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input placeholder="Enter your email" className="flex-1" />
                    <Button>Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              Career Blog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Career Insights & Tips
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Expert advice, industry insights, and practical tips to accelerate your career growth
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{stats.totalPosts} Articles</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>{stats.totalViews.toLocaleString()} Views</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>{stats.categories.length} Categories</span>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  className="pl-10 bg-background/50 backdrop-blur-sm border-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Featured Article</h2>
              <p className="text-muted-foreground">Our most popular career insight</p>
            </div>

            <Card className="overflow-hidden border-primary/20 shadow-xl bg-gradient-to-br from-background to-muted/20">
              <div className="lg:flex">
                <div className="lg:w-1/2">
                  <div className="h-64 lg:h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    <div className="text-center p-8 relative z-10">
                      <Badge className="mb-4 bg-primary text-primary-foreground">⭐ Featured Article</Badge>
                      <h3 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">{featuredPost.title}</h3>
                      <p className="text-muted-foreground mb-6 text-lg">{featuredPost.excerpt}</p>
                      <Button asChild size="lg" className="shadow-lg">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          Read Article <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 p-8">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{featuredPost.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(featuredPost.publishedAt!).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime} min read
                    </div>
                  </div>

                  <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary">
                    {featuredPost.category}
                  </Badge>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-lg">Article Highlights:</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>AI-powered resume optimization techniques</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>ATS compatibility best practices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>Common resume mistakes to avoid</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>Future trends in career technology</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {featuredPost.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{featuredPost.views.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{featuredPost.likes} likes</span> {/* Use the likes field directly */}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{featuredPost._count.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Categories Filter */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Browse by Category</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {stats.categories.map((category) => (
              <Badge
                key={category.category}
                variant="outline"
                className="px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                {category.category} ({category._count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Latest Articles */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Latest Articles</h3>
            <p className="text-muted-foreground">Stay updated with our newest career insights</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <Card
                key={post.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20"
              >
                <div className="h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                  <div className="text-center p-6 relative z-10">
                    <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary">
                      {post.category}
                    </Badge>
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-sm">{post.excerpt}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span>{post.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt!).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes} {/* Use the likes field directly */}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Read Article
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <CardHeader className="text-center relative z-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">Stay Ahead in Your Career</CardTitle>
            <CardDescription className="text-lg">
              Get weekly career insights, job search tips, and exclusive resources delivered to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center relative z-10">
            <div className="max-w-md space-y-4">
              <NewsletterSignup variant="compact" source="blog_post" />
              <p className="text-xs text-muted-foreground">Join 10,000+ professionals. Unsubscribe anytime.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">Weekly Tips</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">Career Guides</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">Job Alerts</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">Expert Advice</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
