import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock blog posts - in production, this would come from a CMS or database
const blogPosts = [
  {
    id: "ai-resume-optimization-2024",
    title: "AI Resume Optimization: The Complete Guide for 2024",
    excerpt: "Learn how artificial intelligence is revolutionizing resume writing and how to leverage AI tools to create a resume that gets noticed by both ATS systems and hiring managers.",
    content: `
# AI Resume Optimization: The Complete Guide for 2024

In today's competitive job market, your resume needs to stand out not just to human recruiters, but also to Applicant Tracking Systems (ATS) that screen resumes before they ever reach human eyes. This is where AI-powered resume optimization comes in.

## Why AI Resume Optimization Matters

Over 98% of Fortune 500 companies use ATS systems to filter resumes. These systems scan for specific keywords, formatting, and structure. A resume that isn't optimized for ATS might never be seen by a human recruiter, regardless of your qualifications.

## Key Benefits of AI Resume Optimization

### 1. ATS Compatibility
AI tools analyze your resume against ATS requirements, ensuring proper formatting and keyword optimization.

### 2. Keyword Optimization
AI identifies industry-specific keywords that are crucial for your target role and suggests where to incorporate them naturally.

### 3. Content Enhancement
AI can suggest improvements to your bullet points, making them more impactful and results-oriented.

### 4. Personalization at Scale
AI enables you to quickly customize your resume for different job applications while maintaining quality.

## How to Use AI for Resume Optimization

### Step 1: Choose the Right AI Tool
Look for tools that offer:
- ATS compatibility checking
- Keyword analysis
- Content suggestions
- Industry-specific optimization

### Step 2: Input Your Current Resume
Upload or paste your existing resume into the AI tool. The more complete your information, the better the AI can help.

### Step 3: Analyze the Results
Review the AI's suggestions for:
- Missing keywords
- Formatting issues
- Content improvements
- Structure optimization

### Step 4: Implement Changes Strategically
Don't blindly accept all suggestions. Use your judgment to maintain authenticity while incorporating valuable improvements.

## Best Practices for AI-Optimized Resumes

1. **Keep it authentic**: AI should enhance your real experience, not fabricate it
2. **Maintain readability**: Ensure your resume is still easy for humans to read
3. **Regular updates**: Re-optimize your resume as you gain new skills and experience
4. **Test different versions**: A/B test different optimizations to see what works best

## Common Mistakes to Avoid

- Over-stuffing keywords
- Losing your personal voice
- Ignoring industry-specific requirements
- Not updating regularly

## The Future of AI Resume Optimization

As AI technology continues to evolve, we can expect even more sophisticated features like:
- Real-time job market analysis
- Predictive career path suggestions
- Dynamic resume adaptation
- Integration with professional networks

## Conclusion

AI resume optimization is no longer optional—it's essential for job search success in 2024. By leveraging AI tools effectively, you can ensure your resume gets past ATS systems and into the hands of hiring managers.

Ready to optimize your resume with AI? Try our free resume enhancement tool and see the difference AI can make in your job search.
    `,
    author: "DomiJob Team",
    publishedAt: "2024-01-15",
    readTime: "8 min read",
    category: "Resume Tips",
    tags: ["AI", "Resume", "Job Search", "ATS"],
    featured: true,
    image: "/blog/ai-resume-optimization.jpg"
  },
  {
    id: "job-search-strategies-2024",
    title: "5 Job Search Strategies That Actually Work in 2024",
    excerpt: "Discover the most effective job search strategies for 2024, from leveraging AI tools to building meaningful professional networks.",
    content: "# 5 Job Search Strategies That Actually Work in 2024\n\nThe job market has evolved significantly...",
    author: "Career Expert",
    publishedAt: "2024-01-10",
    readTime: "6 min read",
    category: "Job Search",
    tags: ["Job Search", "Career", "Networking"],
    featured: false,
    image: "/blog/job-search-strategies.jpg"
  },
  {
    id: "remote-work-resume-tips",
    title: "How to Showcase Remote Work Experience on Your Resume",
    excerpt: "Learn how to effectively highlight your remote work experience and skills to stand out in today's hybrid work environment.",
    content: "# How to Showcase Remote Work Experience on Your Resume\n\nRemote work has become the norm...",
    author: "Remote Work Specialist",
    publishedAt: "2024-01-05",
    readTime: "5 min read",
    category: "Remote Work",
    tags: ["Remote Work", "Resume", "Skills"],
    featured: false,
    image: "/blog/remote-work-resume.jpg"
  }
]

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured)
  const otherPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Career Insights & Tips</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Expert advice, industry insights, and practical tips to accelerate your career growth
        </p>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="mb-12">
          <Card className="overflow-hidden border-primary/20">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Badge className="mb-4">Featured Article</Badge>
                    <h2 className="text-2xl font-bold mb-4">{featuredPost.title}</h2>
                    <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                    <Button asChild>
                      <Link href={`/blog/${featuredPost.id}`}>
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {featuredPost.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(featuredPost.publishedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {featuredPost.readTime}
                  </div>
                </div>
                <Badge variant="secondary" className="mb-4">
                  {featuredPost.category}
                </Badge>
                <div className="space-y-4">
                  <h3 className="font-semibold">What you'll learn:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• How AI is changing resume optimization</li>
                    <li>• Best practices for ATS compatibility</li>
                    <li>• Common mistakes to avoid</li>
                    <li>• Future trends in resume technology</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {featuredPost.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Other Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center p-4">
                <Badge variant="secondary" className="mb-2">
                  {post.category}
                </Badge>
                <h3 className="font-semibold text-sm">{post.title}</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
              <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.publishedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/blog/${post.id}`}>
                  Read More
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Newsletter Signup */}
      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle>Stay Updated</CardTitle>
          <CardDescription>
            Get the latest career tips and job search strategies delivered to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild size="lg">
            <Link href="/newsletter">
              Subscribe to Newsletter
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
