"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"

interface MarketingMaterialsProps {
  affiliateCode?: string
}

export function MarketingMaterials({ affiliateCode = "YOUR_CODE" }: MarketingMaterialsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  
  const baseUrl = "https://domijob.com"
  const affiliateUrl = `${baseUrl}?ref=${affiliateCode}`

  const emailTemplates = [
    {
      id: 'email-1',
      title: 'Job Search Introduction',
      description: 'Introduce Domijob to job seekers',
      htmlCode: `<p>Looking for your next career opportunity?</p>
<p>I've been using <a href="${affiliateUrl}">Domijob</a> to find quality job opportunities, and I think you might find it helpful too.</p>
<p>Their AI-powered platform matches you with jobs that fit your skills and experience, saving you time in your job search.</p>
<p>Check it out: <a href="${affiliateUrl}">${baseUrl}</a></p>`
    },
    {
      id: 'email-2',
      title: 'Recruiter Introduction',
      description: 'Introduce Domijob to recruiters and hiring managers',
      htmlCode: `<p>Looking to streamline your hiring process?</p>
<p>I wanted to recommend <a href="${affiliateUrl}">Domijob</a> as a solution for your recruitment needs.</p>
<p>Their platform uses AI to match you with qualified candidates, reducing time-to-hire and improving quality of matches.</p>
<p>Check it out: <a href="${affiliateUrl}">${baseUrl}</a></p>`
    }
  ]

  const textSnippets = [
    {
      id: 'text-1',
      title: 'Social Media Post - General',
      description: 'Short post for any social platform',
      text: `Looking for a job or hiring? Try Domijob - the AI-powered job matching platform that connects the right people with the right opportunities. Check it out: ${affiliateUrl} #JobSearch #Hiring #AI`
    },
    {
      id: 'text-2',
      title: 'Social Media Post - Job Seekers',
      description: 'Targeted at people looking for jobs',
      text: `Job hunting made simple! Domijob's AI matches your skills with the perfect opportunities. My referral link gets you started: ${affiliateUrl} #CareerMove #JobSearch`
    },
    {
      id: 'text-3',
      title: 'Social Media Post - Recruiters',
      description: 'Targeted at recruiters and hiring managers',
      text: `Recruiters: Cut your time-to-hire by 75% with Domijob's AI-powered candidate matching. Try it through my link: ${affiliateUrl} #Recruiting #HiringTips #HR`
    }
  ]

  const linkVariations = [
    {
      id: 'link-1',
      title: 'Basic Affiliate Link',
      url: affiliateUrl
    },
    {
      id: 'link-2',
      title: 'Jobs Page Link',
      url: `${baseUrl}/jobs?ref=${affiliateCode}`
    },
    {
      id: 'link-3',
      title: 'For Employers Link',
      url: `${baseUrl}/login?ref=${affiliateCode}`
    },
    {
      id: 'link-4',
      title: 'Sign Up Link',
      url: `${baseUrl}/login?ref=${affiliateCode}`
    }
  ]

  const htmlSnippets = [
    {
      id: 'html-1',
      title: 'Simple Text Link',
      description: 'Basic HTML link for websites or emails',
      code: `<a href="${affiliateUrl}">Find your next job on Domijob</a>`
    },
    {
      id: 'html-2',
      title: 'Call-to-Action Button',
      description: 'Button-styled link for websites',
      code: `<a href="${affiliateUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Find Jobs on Domijob</a>`
    }
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md mb-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-400 flex items-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          Note
        </h4>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          These text-based marketing materials are available for immediate use. 
          Image-based materials like banners and social media images will be added soon.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Marketing Materials</h2>
        <p className="text-muted-foreground">
          {affiliateCode === "YOUR_CODE" 
            ? "Promote Domijob with these ready-to-use marketing assets. Replace YOUR_CODE with your affiliate code."
            : `Promote Domijob with these ready-to-use marketing assets. Your affiliate code (${affiliateCode}) is already included in all links and snippets.`
          }
        </p>
      </div>

      <Tabs defaultValue="links">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="links">Affiliate Links</TabsTrigger>
          <TabsTrigger value="snippets">Text Snippets</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="html">HTML Code</TabsTrigger>
        </TabsList>

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
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md min-h-[100px]">
                    {snippet.text}
                  </div>
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