"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Plus,
  X,
  Trash2
} from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  "Resume Tips",
  "Job Search",
  "Career Advice",
  "Interview Tips",
  "Remote Work",
  "AI Tools",
  "Industry Insights",
  "Salary Negotiation"
]

const COMMON_TAGS = [
  "AI", "Resume", "Job Search", "Career", "Interview", "Remote Work",
  "ATS", "LinkedIn", "Networking", "Skills", "Salary", "Tips"
]

interface EditBlogPostPageProps {
  params: {
    id: string
  }
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [] as string[],
    published: false,
    featured: false,
    metaTitle: "",
    metaDescription: ""
  })
  const [newTag, setNewTag] = useState("")

  // Load existing post data
  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${params.id}`)
        if (response.ok) {
          const post = await response.json()
          setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            category: post.category,
            tags: post.tags,
            published: post.published,
            featured: post.featured,
            metaTitle: post.metaTitle || post.title,
            metaDescription: post.metaDescription || post.excerpt
          })
        } else {
          toast.error("Failed to load blog post")
          router.push("/admin/blog")
        }
      } catch (error) {
        console.error("Error loading post:", error)
        toast.error("Failed to load blog post")
        router.push("/admin/blog")
      } finally {
        setIsLoadingPost(false)
      }
    }

    loadPost()
  }, [params.id, router])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      metaTitle: title
    }))
  }

  const handleExcerptChange = (excerpt: string) => {
    setFormData(prev => ({
      ...prev,
      excerpt,
      metaDescription: excerpt
    }))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
    setNewTag("")
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.excerpt || !formData.content || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/blog/posts/${formData.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          readTime: Math.ceil(formData.content.split(" ").length / 200)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Blog post updated successfully!")
        router.push("/admin/blog")
      } else {
        toast.error(data.error || "Failed to update blog post")
      }
    } catch (error) {
      console.error("Error updating blog post:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/blog/posts/${formData.slug}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Blog post deleted successfully!")
        router.push("/admin/blog")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete blog post")
      }
    } catch (error) {
      console.error("Error deleting blog post:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    if (formData.published) {
      window.open(`/blog/${formData.slug}`, "_blank")
    } else {
      localStorage.setItem("blog-preview", JSON.stringify(formData))
      window.open("/admin/blog/preview", "_blank")
    }
  }

  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Blog Post</h1>
            <p className="text-muted-foreground">
              Update your blog post content and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!formData.title}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update Post
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>
                Update your blog post content here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter an engaging title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="mt-1"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL slug cannot be changed after creation
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleExcerptChange(e.target.value)}
                  placeholder="Write a compelling excerpt that summarizes your post..."
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.excerpt.length}/300 characters
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your blog post content here. You can use Markdown formatting..."
                  className="mt-1 min-h-[400px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.content.split(" ").length} words • ~{Math.ceil(formData.content.split(" ").length / 200)} min read
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured post</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={formData.category === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, category }))}
                    className="justify-start"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag(newTag)
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Common tags:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTag(tag)}
                      disabled={formData.tags.includes(tag)}
                      className="text-xs h-6"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="SEO description..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
