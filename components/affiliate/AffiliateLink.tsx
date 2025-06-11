"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface AffiliateLinkProps {
  code: string
}

export function AffiliateLink({ code }: AffiliateLinkProps) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  const links = {
    simple: `${baseUrl}/?ref=${code}`,
    signup: `${baseUrl}/login?ref=${code}`,
    jobs: `${baseUrl}/jobs?ref=${code}`,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Affiliate Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Share these links to earn commission when people sign up through them:</p>
        
        <Tabs defaultValue="simple">
          <TabsList className="mb-4">
            <TabsTrigger value="simple">Homepage</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple" className="space-y-4">
            <div className="flex items-center">
              <Input readOnly value={links.simple} className="flex-1 mr-2" />
              <Button 
                onClick={() => copyToClipboard(links.simple)}
                variant="outline"
                size="icon"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Send visitors to our homepage with your affiliate code.
            </p>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="flex items-center">
              <Input readOnly value={links.signup} className="flex-1 mr-2" />
              <Button 
                onClick={() => copyToClipboard(links.signup)}
                variant="outline"
                size="icon"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Send visitors directly to the registration page.
            </p>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center">
              <Input readOnly value={links.jobs} className="flex-1 mr-2" />
              <Button 
                onClick={() => copyToClipboard(links.jobs)}
                variant="outline"
                size="icon"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Send visitors directly to the jobs listing page.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Promotional Tips</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Share on social media profiles and groups</li>
            <li>Include in your email signature</li>
            <li>Add to your personal website or blog</li>
            <li>Share in professional communities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 