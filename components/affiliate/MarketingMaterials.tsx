"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"
import { ScrollableTabsList } from "./ScrollableTabsList"

interface MarketingMaterialsProps {
  affiliateCode?: string
}

export function MarketingMaterials({ affiliateCode = "YOUR_CODE" }: MarketingMaterialsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_URL
  const affiliateUrl = `${baseUrl}?ref=${affiliateCode}`

  const emailTemplates = [
    {
      id: "email-1",
      title: "Job Search Introduction",
      description: "Introduce Domijob to job seekers",
      htmlCode: `<p>Ready to transform your career search?</p>
<p>I've been using <a href="${affiliateUrl}">Domijob</a> to discover quality job opportunities, and I think you should start your job search today too.</p>
<p>Their AI-powered platform finds 10+ job matches in 5 minutes that perfectly fit your skills and experience, saving you hours of searching.</p>
<p>Unlock your career potential now: <a href="${affiliateUrl}">${baseUrl}</a></p>`,
    },
    {
      id: "email-2",
      title: "Recruiter Introduction",
      description: "Introduce Domijob to recruiters and hiring managers",
      htmlCode: `<p>Ready to transform your hiring process today?</p>
<p>I wanted to recommend <a href="${affiliateUrl}">Domijob</a> as the solution that will unlock faster recruitment results.</p>
<p>Their platform uses AI to discover qualified candidates in minutes, reducing time-to-hire by 75% and transforming your hiring quality.</p>
<p>Start hiring smarter today: <a href="${affiliateUrl}">${baseUrl}</a></p>`,
    },
    {
      id: "email-3",
      title: "Urgent Job Search",
      description: "Time-sensitive job search promotion",
      htmlCode: `<p>Don't let another day pass in your job search!</p>
<p><a href="${affiliateUrl}">Domijob's AI</a> can find 10+ perfect job matches for you in just 5 minutes - no more endless scrolling through irrelevant listings.</p>
<p>Transform your career search today and discover opportunities that actually fit your skills.</p>
<p>Start your success story now: <a href="${affiliateUrl}">${baseUrl}</a></p>`,
    },
  ]

  const textSnippets = [
    {
      id: "text-1",
      title: "Social Media Post - General",
      description: "Short post for any social platform",
      text: `Transform your career today! Discover how Domijob's AI finds 10+ perfect job matches in 5 minutes. Start your job search now: ${affiliateUrl} #JobSearch #Hiring #AI #CareerTransformation`,
    },
    {
      id: "text-2",
      title: "Social Media Post - Job Seekers",
      description: "Targeted at people looking for jobs",
      text: `Stop wasting time on job boards! Unlock Domijob's AI that finds 10+ job matches in 5 minutes. Transform your job search today: ${affiliateUrl} #CareerMove #JobSearch #StartToday`,
    },
    {
      id: "text-3",
      title: "Social Media Post - Recruiters",
      description: "Targeted at recruiters and hiring managers",
      text: `Recruiters: Transform your hiring today! Discover how to find qualified candidates 75% faster with Domijob's AI. Start hiring smarter now: ${affiliateUrl} #Recruiting #HiringTips #HR #TransformHiring`,
    },
    {
      id: "text-4",
      title: "AI Tools - Urgent Benefits",
      description: "Promote the benefits with urgency and power words",
      text: `Unlock Domijob's AI Tools today—no sign up needed! Discover 50 free guest credits to transform your job search with powerful features like instant job matching and resume enhancement. Start your career transformation now: ${affiliateUrl} #AI #JobSearch #UnlockSuccess`,
    },
    {
      id: "text-5",
      title: "AI Job Matcher - Specific Results",
      description: "Highlight specific, measurable benefits",
      text: `Find 10+ perfect job matches in 5 minutes! Unlock Domijob's AI Job Matcher with 50 free guest credits—no sign up needed. Transform your job search today: ${affiliateUrl} #AI #JobMatching #Career #StartToday`,
    },
    {
      id: "text-6",
      title: "Resume Enhancer - Transform Results",
      description: "Highlight transformation and urgency",
      text: `Transform your resume today and unlock more interviews! Discover Domijob's AI Resume Enhancer with 50 free guest credits—no sign up required. Start getting noticed by employers now: ${affiliateUrl} #Resume #AI #JobSearch #TransformCareer`,
    },
    {
      id: "text-7",
      title: "Job Description Enhancer - Recruiter Urgency",
      description: "Urgent CTA for recruiters with specific benefits",
      text: `Recruiters: Discover top talent 75% faster! Transform your job posts today with Domijob's AI-powered enhancer. Unlock 50 free guest credits and start attracting quality candidates now: ${affiliateUrl} #Recruiting #AI #Hiring #StartToday`,
    },
    {
      id: "text-8",
      title: "Limited Time Opportunity",
      description: "Creates urgency with time-sensitive language",
      text: `Don't miss out! Unlock Domijob's complete AI toolkit today. Discover how 10,000+ job seekers find their dream jobs in minutes. Transform your career search now: ${affiliateUrl} #LimitedTime #CareerSuccess #StartToday`,
    },
    {
      id: "text-9",
      title: "Success-Focused CTA",
      description: "Focuses on transformation and success",
      text: `Ready to unlock your career potential? Discover how Domijob's AI transforms job searching - find 10+ matches in 5 minutes, enhance your resume instantly, and start landing interviews today: ${affiliateUrl} #UnlockSuccess #TransformCareer #StartToday`,
    },
  ]

  const linkVariations = [
    {
      id: "link-1",
      title: "Basic Affiliate Link",
      url: affiliateUrl,
    },
    {
      id: "link-2",
      title: "Jobs Page Link",
      url: `${baseUrl}/jobs?ref=${affiliateCode}`,
    },
    {
      id: "link-3",
      title: "For Employers Link",
      url: `${baseUrl}/login?ref=${affiliateCode}`,
    },
    {
      id: "link-4",
      title: "Sign Up Link",
      url: `${baseUrl}/login?ref=${affiliateCode}`,
    },
  ]

  const htmlSnippets = [
    {
      id: "html-1",
      title: "Simple Text Link",
      description: "Basic HTML link for websites or emails",
      code: `<a href="${affiliateUrl}">Transform your job search today on Domijob</a>`,
    },
    {
      id: "html-2",
      title: "Call-to-Action Button",
      description: "Button-styled link for websites",
      code: `<a href="${affiliateUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Start Your Job Search Today</a>`,
    },
    {
      id: "html-3",
      title: "Urgent Action Button",
      description: "High-urgency button with power words",
      code: `<a href="${affiliateUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); animation: pulse 2s infinite;">Unlock 10+ Job Matches in 5 Minutes!</a>`,
    },
    {
      id: "html-4",
      title: "Success-Focused Button",
      description: "Transformation-focused CTA button",
      code: `<a href="${affiliateUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Discover Your Dream Job Today</a>`,
    },
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(null), 2000)
  }

  // Define tabs for the ScrollableTabsList component
  const tabs = [
    { value: "links", label: "Affiliate Links" },
    { value: "snippets", label: "Text Snippets" },
    { value: "email", label: "Email Templates" },
    { value: "html", label: "HTML Code" },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md mb-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-400 flex items-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          Enhanced CTAs
        </h4>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Updated with powerful action words, urgency elements, and specific measurable benefits to increase conversion
          rates.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Marketing Materials</h2>
        <p className="text-muted-foreground">
          {affiliateCode === "YOUR_CODE"
            ? "Promote Domijob with these high-converting marketing assets. Replace YOUR_CODE with your affiliate code."
            : `Promote Domijob with these high-converting marketing assets. Your affiliate code (${affiliateCode}) is already included in all links and snippets.`}
        </p>
      </div>

      <Tabs defaultValue="links">
        <ScrollableTabsList tabs={tabs} />

        <TabsContent value="links" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {linkVariations.map((link) => (
              <Card key={link.id}>
                <CardHeader>
                  <CardTitle>{link.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md font-mono text-sm break-all">
                    {link.url}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(link.url, link.id)}
                  >
                    {copied === link.id ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="snippets" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {textSnippets.map((snippet) => (
              <Card key={snippet.id}>
                <CardHeader>
                  <CardTitle>{snippet.title}</CardTitle>
                  <CardDescription>{snippet.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md min-h-[100px]">{snippet.text}</div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(snippet.text, snippet.id)}
                  >
                    {copied === snippet.id ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy Text
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {emailTemplates.map((email) => (
              <Card key={email.id}>
                <CardHeader>
                  <CardTitle>{email.title}</CardTitle>
                  <CardDescription>{email.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 max-h-[200px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{email.htmlCode}</pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(email.htmlCode, email.id)}
                  >
                    {copied === email.id ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy HTML
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="html" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {htmlSnippets.map((html) => (
              <Card key={html.id}>
                <CardHeader>
                  <CardTitle>{html.title}</CardTitle>
                  <CardDescription>{html.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 max-h-[150px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{html.code}</pre>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <div dangerouslySetInnerHTML={{ __html: html.code }} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(html.code, html.id)}
                  >
                    {copied === html.id ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy HTML
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
