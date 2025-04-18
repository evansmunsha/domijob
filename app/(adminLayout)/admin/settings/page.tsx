"use client"

import { auth } from "@/app/utils/auth"
import { redirect, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import Head from "next/head"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Site settings
  const [siteName, setSiteName] = useState("MiJob")
  const [siteDescription, setSiteDescription] = useState("Find your next career opportunity")
  const [logoUrl, setLogoUrl] = useState("/logo.png")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  
  // Jobs settings
  const [jobExpireDays, setJobExpireDays] = useState(30)
  const [allowFeaturedJobs, setAllowFeaturedJobs] = useState(true)
  const [featuredJobPrice, setFeaturedJobPrice] = useState(99.99)
  
  // Affiliate settings
  const [affiliateEnabled, setAffiliateEnabled] = useState(true)
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(10)
  const [minPayoutAmount, setMinPayoutAmount] = useState(50)
  
  // Simulate fetching settings
  useEffect(() => {
    // In a real app, fetch settings from API
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])
  
  const handleSaveSettings = async () => {
    setSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In a real app, save settings via API
    toast.success("Settings saved successfully")
    setSaving(false)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <Head>
        <title>Settings | Admin Dashboard</title>
        <meta name="description" content="Manage system settings and configurations" />
      </Head>
      
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system settings and configurations
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Configure general website settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input 
                    id="site-name" 
                    value={siteName} 
                    onChange={(e) => setSiteName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primary-color" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)} 
                    />
                    <div 
                      className="h-[40px] w-[40px] rounded-md border"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Input 
                  id="site-description" 
                  value={siteDescription} 
                  onChange={(e) => setSiteDescription(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input 
                  id="logo-url" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Settings</CardTitle>
              <CardDescription>
                Configure job listing and application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-expire-days">Job Expiration (days)</Label>
                <Input 
                  id="job-expire-days" 
                  type="number"
                  value={jobExpireDays} 
                  onChange={(e) => setJobExpireDays(parseInt(e.target.value))} 
                />
                <p className="text-sm text-muted-foreground">
                  Number of days until job listings expire
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Featured Jobs</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable premium featured job listings
                  </p>
                </div>
                <Switch 
                  checked={allowFeaturedJobs}
                  onCheckedChange={setAllowFeaturedJobs}
                />
              </div>
              
              {allowFeaturedJobs && (
                <div className="space-y-2">
                  <Label htmlFor="featured-job-price">Featured Job Price ($)</Label>
                  <Input 
                    id="featured-job-price" 
                    type="number"
                    step="0.01"
                    value={featuredJobPrice} 
                    onChange={(e) => setFeaturedJobPrice(parseFloat(e.target.value))} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Settings</CardTitle>
              <CardDescription>
                Configure the affiliate program settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Affiliate Program</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to join the affiliate program
                  </p>
                </div>
                <Switch 
                  checked={affiliateEnabled}
                  onCheckedChange={setAffiliateEnabled}
                />
              </div>
              
              {affiliateEnabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
                    <Input 
                      id="commission-rate" 
                      type="number"
                      value={defaultCommissionRate} 
                      onChange={(e) => setDefaultCommissionRate(parseInt(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-payout">Minimum Payout Amount ($)</Label>
                    <Input 
                      id="min-payout" 
                      type="number"
                      value={minPayoutAmount} 
                      onChange={(e) => setMinPayoutAmount(parseInt(e.target.value))} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum amount required for affiliates to request payment
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
              <CardDescription>
                Manage third-party API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input 
                  id="api-key" 
                  value="sk_live_•••••••••••••••••••••••••••"
                  type="password"
                  readOnly
                />
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Payment Provider</h3>
                    <p className="text-sm text-muted-foreground">Stripe</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Provider</h3>
                    <p className="text-sm text-muted-foreground">SendGrid</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Google Analytics</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!saving && <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
} 