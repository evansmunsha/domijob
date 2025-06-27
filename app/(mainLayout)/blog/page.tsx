"use client"
import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, ArrowRight, User, Search, TrendingUp, BookOpen, Eye, Heart } from "lucide-react"
import Link from "next/link"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export default function BlogPage() {
  const [search, setSearch] = useState("")
  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ totalPosts: 0, totalViews: 0, categories: [] })
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string | null>(null)

  // Fetch posts from API
  const fetchPosts = useCallback(async (searchValue: string, categoryValue: string | null) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchValue) params.set("search", searchValue)
    if (categoryValue) params.set("category", categoryValue)
    params.set("limit", "20")
    const res = await fetch(`/api/blog/posts?${params.toString()}`)
    const data = await res.json()
    setPosts(data.posts || [])
    setStats({
      totalPosts: data.pagination?.total || 0,
      totalViews: data.pagination?.totalViews || 0,
      categories: data.filters?.categories || [],
    })
    setLoading(false)
  }, [])

  // Debounced search
  const debouncedFetch = useCallback(debounce(fetchPosts, 400), [fetchPosts])

  useEffect(() => {
    debouncedFetch(search, category)
  }, [search, category, debouncedFetch])

  useEffect(() => {
    // Initial load
    fetchPosts("", null)
  }, [fetchPosts])

  // Featured/other logic
  let featuredPost = null
  let otherPosts = posts
  for (const post of posts) {
    if (post.featured) {
      featuredPost = post
      otherPosts = posts.filter((p) => p.id !== post.id)
      break
    }
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">No blog posts found</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Try a different search or check back soon for new content.
            </p>
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
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  disabled={loading}
                />
                {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Loading...</span>}
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
                      {new Date(featuredPost.publishedAt).toLocaleDateString()}
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
                    <div className="flex flex-wrap gap-2">
                      {featuredPost.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{featuredPost.views?.toLocaleString?.() ?? featuredPost.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{featuredPost.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{featuredPost._count?.comments ?? 0} comments</span>
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
            {stats.categories.map((cat: any) => (
              <Badge
                key={cat.name}
                variant={category === cat.name ? "default" : "outline"}
                className="px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                onClick={() => setCategory(category === cat.name ? null : cat.name)}
              >
                {cat.name} ({cat.count})
              </Badge>
            ))}
            {category && (
              <Button size="sm" variant="ghost" onClick={() => setCategory(null)}>
                Clear Filter
              </Button>
            )}
          </div>
        </div>
        {/* Latest Articles */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Latest Articles</h3>
            <p className="text-muted-foreground">Stay updated with our newest career insights</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post: any) => (
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
                      {new Date(post.publishedAt).toLocaleDateString()}
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
                        {post.likes}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags?.slice(0, 3).map((tag: string) => (
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
            <div className="flex flex-col items-center space-y-4">
              <NewsletterSignup variant="default" source="blog_post" />
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
