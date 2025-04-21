"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CopyIcon, DownloadIcon, LinkIcon, AlertCircleIcon, CheckIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface MarketingMaterialsProps {
  affiliateCode?: string
}

export function MarketingMaterials({ affiliateCode = "YOUR_CODE" }: MarketingMaterialsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const banners = [
    {
      id: 'banner-1',
      title: 'Banner 728x90',
      description: 'Leaderboard banner for website headers',
      imageUrl: '/assets/affiliate/banner-728x90.png',
      imageWidth: 728,
      imageHeight: 90,
      htmlCode: `<a href="https://domijob.com?ref=${affiliateCode}"><img src="https://domijob.com/assets/affiliate/banner-728x90.png" alt="Domijob - Find your next job" width="728" height="90" /></a>`
    },
    {
      id: 'banner-2',
      title: 'Banner 300x250',
      description: 'Medium rectangle banner for sidebars',
      imageUrl: '/assets/affiliate/banner-300x250.png',
      imageWidth: 300,
      imageHeight: 250,
      htmlCode: `<a href="https://domijob.com?ref=${affiliateCode}"><img src="https://domijob.com/assets/affiliate/banner-300x250.png" alt="Domijob - Find your next job" width="300" height="250" /></a>`
    },
    {
      id: 'banner-3',
      title: 'Banner 160x600',
      description: 'Skyscraper banner for sidebars',
      imageUrl: '/assets/affiliate/banner-160x600.png',
      imageWidth: 160,
      imageHeight: 600,
      htmlCode: `<a href="https://domijob.com?ref=${affiliateCode}"><img src="https://domijob.com/assets/affiliate/banner-160x600.png" alt="Domijob - Find your next job" width="160" height="600" /></a>`
    }
  ]

  const emailTemplates = [
    {
      id: 'email-1',
      title: 'Job Search Introduction',
      description: 'Introduce Domijob to job seekers',
      htmlCode: `<p>Looking for your next career opportunity?</p>
<p>I've been using <a href="https://domijob.com?ref=${affiliateCode}">Domijob</a> to find quality job opportunities, and I think you might find it helpful too.</p>
<p>Their AI-powered platform matches you with jobs that fit your skills and experience, saving you time in your job search.</p>
<p>Check it out: <a href="https://domijob.com?ref=${affiliateCode}">https://domijob.com</a></p>`
    },
    {
      id: 'email-2',
      title: 'Recruiter Introduction',
      description: 'Introduce Domijob to recruiters and hiring managers',
      htmlCode: `<p>Looking to streamline your hiring process?</p>
<p>I wanted to recommend <a href="https://domijob.com?ref=${affiliateCode}">Domijob</a> as a solution for your recruitment needs.</p>
<p>Their platform uses AI to match you with qualified candidates, reducing time-to-hire and improving quality of matches.</p>
<p>Check it out: <a href="https://domijob.com?ref=${affiliateCode}">https://domijob.com</a></p>`
    }
  ]

  const socialMediaImages = [
    {
      id: 'social-1',
      title: 'LinkedIn Post Image',
      description: 'Optimized for LinkedIn feed posts',
      imageUrl: '/assets/affiliate/social-linkedin.png',
      imageWidth: 1200,
      imageHeight: 627
    },
    {
      id: 'social-2',
      title: 'Twitter Post Image',
      description: 'Optimized for Twitter feed posts',
      imageUrl: '/assets/affiliate/social-twitter.png',
      imageWidth: 1200,
      imageHeight: 675
    },
    {
      id: 'social-3',
      title: 'Instagram Post Image',
      description: 'Optimized for Instagram feed posts',
      imageUrl: '/assets/affiliate/social-instagram.png',
      imageWidth: 1080,
      imageHeight: 1080
    }
  ]

  const landingPages = [
    {
      id: 'landing-1',
      title: 'Job Seekers Landing Page',
      description: 'Focused on job seekers and candidates',
      previewUrl: '/assets/affiliate/landing-jobseekers.png',
      downloadUrl: '/assets/affiliate/landing-jobseekers.html'
    },
    {
      id: 'landing-2',
      title: 'Recruiters Landing Page',
      description: 'Focused on recruiters and companies',
      previewUrl: '/assets/affiliate/landing-recruiters.png',
      downloadUrl: '/assets/affiliate/landing-recruiters.html'
    }
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadImage = (imageSrc: string, title: string) => {
    const link = document.createElement("a")
    link.href = imageSrc
    link.download = title.toLowerCase().replace(/\s+/g, "-")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Download started!")
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Marketing Materials</h2>
        <p className="text-muted-foreground">
          {affiliateCode === "YOUR_CODE" 
            ? "Promote Mijob with these ready-to-use marketing assets. Replace YOUR_CODE with your affiliate code in all HTML snippets and URLs."
            : `Promote Mijob with these ready-to-use marketing assets. Your affiliate code (${affiliateCode}) is already included in all HTML snippets and URLs.`
          }
        </p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="landing">Landing Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{banner.title}</CardTitle>
                  <CardDescription>{banner.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="border border-border overflow-hidden">
                    <Image 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      width={banner.imageWidth} 
                      height={banner.imageHeight} 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(banner.htmlCode, banner.id)}
                  >
                    {copied === banner.id ? (
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
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={banner.imageUrl} download>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {emailTemplates.map((email) => (
              <Card key={email.id}>
                <CardHeader>
                  <CardTitle>{email.title}</CardTitle>
                  <CardDescription>{email.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{email.htmlCode}</pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(email.htmlCode, email.id)}
                    className="w-full"
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

        <TabsContent value="social" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialMediaImages.map((image) => (
              <Card key={image.id}>
                <CardHeader>
                  <CardTitle>{image.title}</CardTitle>
                  <CardDescription>{image.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="border border-border overflow-hidden max-w-full">
                    <Image 
                      src={image.imageUrl} 
                      alt={image.title} 
                      width={image.imageWidth} 
                      height={image.imageHeight} 
                      className="max-w-full h-auto"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <a href={image.imageUrl} download>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download Image
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {landingPages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle>{page.title}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="border border-border overflow-hidden max-w-full">
                    <Image 
                      src={page.previewUrl} 
                      alt={page.title} 
                      width={800} 
                      height={600} 
                      className="max-w-full h-auto"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(page.previewUrl, '_blank')}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={page.downloadUrl} download>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download HTML
                    </a>
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