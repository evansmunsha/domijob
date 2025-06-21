"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Lightbulb, PenTool, Search, Loader2, Copy, ArrowRight, Sparkles, Target, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"

interface BlogIdea {
  title: string
  excerpt: string
  keywords: string[]
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedReadTime: number
}

interface BlogOutline {
  title: string
  introduction: string
  sections: {
    heading: string
    points: string[]
  }[]
  conclusion: string
  callToAction: string
}

export default function AIBlogAssistantPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("ideas")

  // Content Ideas State
  const [ideaKeywords, setIdeaKeywords] = useState("")
  const [generatedIdeas, setGeneratedIdeas] = useState<BlogIdea[]>([])

  // Content Writing State
  const [writingTopic, setWritingTopic] = useState("")
  const [writingType, setWritingType] = useState("outline")
  const [fastMode, setFastMode] = useState(false) // New fast mode toggle
  const [generatedContent, setGeneratedContent] = useState("")

  // SEO Optimization State
  const [seoContent, setSeoContent] = useState("")
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null)

  const generateIdeas = async () => {
    if (!ideaKeywords.trim()) {
      toast.error("Please enter some keywords")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/blog/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: ideaKeywords,
          niche: "career development and AI tools",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate ideas")

      const data = await response.json()
      setGeneratedIdeas(data.ideas)

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success("Blog ideas generated successfully!")
      }
    } catch (error) {
      console.error("Error generating ideas:", error)
      toast.error("Failed to generate ideas")
    } finally {
      setIsLoading(false)
    }
  }

  const generateContent = async () => {
    if (!writingTopic.trim()) {
      toast.error("Please enter a topic")
      return
    }

    setIsLoading(true)

    // Show different loading messages for different types
    const loadingMessages = {
      outline: "Creating outline structure...",
      section: "Writing detailed section...",
      introduction: "Crafting introduction...",
      conclusion: "Writing conclusion...",
    }

    toast.loading(loadingMessages[writingType as keyof typeof loadingMessages] || "Generating content...")

    try {
      const endpoint = fastMode ? "/api/ai/blog/generate-content-fast" : "/api/ai/blog/generate-content"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: writingTopic,
          type: writingType,
          niche: "career development and AI tools",
        }),
      })

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error("Request timed out. Try using Fast Mode for quicker results.")
        }
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)

      toast.dismiss() // Dismiss loading toast

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success("Content generated successfully!")
      }
    } catch (error) {
      toast.dismiss() // Dismiss loading toast
      console.error("Error generating content:", error)

      if (error instanceof Error && error.message.includes("timed out")) {
        toast.error("Generation timed out. Try Fast Mode or a shorter topic.")
      } else {
        toast.error("Failed to generate content")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeForSEO = async () => {
    if (!seoContent.trim()) {
      toast.error("Please enter content to optimize")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/blog/optimize-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: seoContent }),
      })

      if (!response.ok) throw new Error("Failed to optimize content")

      const data = await response.json()
      setSeoSuggestions(data.suggestions)

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success("SEO analysis completed!")
      }
    } catch (error) {
      console.error("Error optimizing content:", error)
      toast.error("Failed to optimize content")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const createPostFromIdea = (idea: BlogIdea) => {
    const postData = {
      title: idea.title,
      excerpt: idea.excerpt,
      category: idea.category,
      tags: idea.keywords,
    }

    localStorage.setItem("ai-generated-post", JSON.stringify(postData))
    window.open("/admin/blog/new?from=ai", "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Blog Assistant
          </h1>
          <p className="text-muted-foreground">Let AI help you create engaging, SEO-optimized blog content</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/blog">Back to Blog Management</Link>
        </Button>
      </div>

      {/* AI Assistant Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Content Ideas
          </TabsTrigger>
          <TabsTrigger value="writing" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Content Writing
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO Optimization
          </TabsTrigger>
        </TabsList>

        {/* Content Ideas Tab */}
        <TabsContent value="ideas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Generate Blog Ideas
              </CardTitle>
              <CardDescription>
                Enter keywords related to your niche and get AI-generated blog post ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={ideaKeywords}
                  onChange={(e) => setIdeaKeywords(e.target.value)}
                  placeholder="e.g., resume optimization, AI job search, career change, remote work"
                  className="mt-1"
                />
              </div>

              <Button onClick={generateIdeas} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                Generate Ideas
              </Button>

              {generatedIdeas.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="font-semibold">Generated Ideas:</h3>
                  {generatedIdeas.map((idea, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg">{idea.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">{idea.difficulty}</Badge>
                            <Badge variant="secondary">{idea.estimatedReadTime} min</Badge>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{idea.excerpt}</p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {idea.keywords.map((keyword, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => createPostFromIdea(idea)}
                            className="flex items-center gap-1"
                          >
                            <ArrowRight className="h-3 w-3" />
                            Create Post
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(`${idea.title}\n\n${idea.excerpt}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Writing Tab */}
        <TabsContent value="writing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-blue-500" />
                AI Content Writer
              </CardTitle>
              <CardDescription>Generate outlines, introductions, or full blog post content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Blog Post Topic</Label>
                <Input
                  id="topic"
                  value={writingTopic}
                  onChange={(e) => setWritingTopic(e.target.value)}
                  placeholder="e.g., How to optimize your resume for ATS systems"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Content Type</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { value: "outline", label: "Outline" },
                    { value: "introduction", label: "Introduction" },
                    { value: "section", label: "Section" },
                    { value: "conclusion", label: "Conclusion" },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={writingType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setWritingType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fast Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="fast-mode" className="font-medium">
                    Fast Mode
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    Recommended for Outline & Section
                  </Badge>
                </div>
                <Switch id="fast-mode" checked={fastMode} onCheckedChange={setFastMode} />
              </div>

              <Button onClick={generateContent} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                {fastMode ? "Generate Fast" : "Generate Content"}
              </Button>

              {generatedContent && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Generated Content</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedContent)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Optimization Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-500" />
                SEO Optimization
              </CardTitle>
              <CardDescription>Analyze and optimize your content for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo-content">Content to Optimize</Label>
                <Textarea
                  id="seo-content"
                  value={seoContent}
                  onChange={(e) => setSeoContent(e.target.value)}
                  placeholder="Paste your blog post content here for SEO analysis..."
                  className="mt-1 min-h-[200px]"
                />
              </div>

              <Button onClick={optimizeForSEO} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                Analyze SEO
              </Button>

              {seoSuggestions && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      SEO Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-2xl font-bold text-green-600">{seoSuggestions.score}/100</div>
                        <div className="text-sm text-muted-foreground">SEO Score</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{seoSuggestions.readability}</div>
                        <div className="text-sm text-muted-foreground">Readability</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-2xl font-bold text-purple-600">{seoSuggestions.keywords?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Keywords Found</div>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Recommendations:</h4>
                      {seoSuggestions.recommendations?.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
