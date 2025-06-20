import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Sparkles, Target, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

interface AIToolPromotion {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

const AI_TOOLS: AIToolPromotion[] = [
  {
    title: "AI Resume Enhancer",
    description: "Optimize your resume for ATS systems and recruiters",
    href: "/ai-tools/resume-enhancer",
    icon: <Sparkles className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    title: "Smart Job Matching",
    description: "Find jobs that perfectly match your skills and experience",
    href: "/ai-tools/job-matcher",
    icon: <Target className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    title: "Interview Prep AI",
    description: "Practice interviews with AI-powered feedback",
    href: "/ai-tools/interview-prep",
    icon: <Users className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  {
    title: "Salary Negotiator",
    description: "Get data-driven salary insights and negotiation tips",
    href: "/ai-tools/salary-negotiator",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "bg-orange-500",
  },
]

interface BlogPostTemplateProps {
  title: string
  content: string
  category: string
  tags: string[]
  readTime: number
}

export function BlogPostTemplate({ title, content, category, tags, readTime }: BlogPostTemplateProps) {
  // Get relevant AI tools based on content/category
  const getRelevantTools = () => {
    const contentLower = (title + content + category).toLowerCase()

    if (contentLower.includes("resume") || contentLower.includes("cv")) {
      return [AI_TOOLS[0], AI_TOOLS[1]] // Resume Enhancer + Job Matching
    }
    if (contentLower.includes("interview")) {
      return [AI_TOOLS[2], AI_TOOLS[0]] // Interview Prep + Resume Enhancer
    }
    if (contentLower.includes("salary") || contentLower.includes("negotiat")) {
      return [AI_TOOLS[3], AI_TOOLS[1]] // Salary Negotiator + Job Matching
    }
    if (contentLower.includes("job") || contentLower.includes("search")) {
      return [AI_TOOLS[1], AI_TOOLS[0]] // Job Matching + Resume Enhancer
    }

    // Default: show first 2 tools
    return AI_TOOLS.slice(0, 2)
  }

  const relevantTools = getRelevantTools()

  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{category}</Badge>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{readTime} min read</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* AI Tools Promotion */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-8">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Ready to Accelerate Your Career?
            </h3>
            <p className="text-muted-foreground">Try our AI-powered tools to take your job search to the next level</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {relevantTools.map((tool, index) => (
              <Card key={index} className="border-2 border-transparent hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`${tool.color} p-2 rounded-lg text-white`}>{tool.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{tool.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                      <Button asChild size="sm" className="w-full">
                        <Link href={tool.href}>
                          Try Now
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button asChild variant="outline">
              <Link href="/ai-tools">
                View All AI Tools
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter CTA */}
      <Card className="bg-gradient-to-r from-secondary/20 to-secondary/10 border-secondary/30">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Stay Updated with Career Tips</h3>
          <p className="text-muted-foreground mb-4">
            Get weekly insights, job search strategies, and exclusive resources delivered to your inbox.
          </p>
          <Button asChild>
            <Link href="/newsletter">Subscribe to Newsletter</Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  )
}
