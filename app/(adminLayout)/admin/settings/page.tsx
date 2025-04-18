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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import Head from "next/head"
import { EmailConfigModal } from "@/components/admin/EmailConfigModal"
import { StripeConfigModal } from "@/components/admin/StripeConfigModal"
import { AffiliateSettingsTab } from "@/components/admin/AffiliateSettingsTab"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [stripeModalOpen, setStripeModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  
  // Site settings
  const [siteName, setSiteName] = useState("MiJob")
  const [siteDescription, setSiteDescription] = useState("Find your next career opportunity")
  const [logoUrl, setLogoUrl] = useState("/logo.png")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  
  // Jobs settings
  const [jobExpireDays, setJobExpireDays] = useState(30)
  const [allowFeaturedJobs, setAllowFeaturedJobs] = useState(true)
  const [featuredJobPrice, setFeaturedJobPrice] = useState(99.99)
  
  // Integration settings
  const [apiKey, setApiKey] = useState("sk_live_•••••••••••••••••••••••••••")
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeKey, setStripeKey] = useState("")
  const [emailProvider, setEmailProvider] = useState("resend")
  const [emailConnected, setEmailConnected] = useState(false)
  const [emailFromAddress, setEmailFromAddress] = useState("noreply@yourdomain.com")
  const [analyticsConnected, setAnalyticsConnected] = useState(false)
  const [analyticsId, setAnalyticsId] = useState("")
  
  // Affiliate settings
  const [affiliateSettings, setAffiliateSettings] = useState({
    enabled: false,
    commissionRate: 10,
    minPayout: 50,
    payoutMethods: ["paypal", "bank_transfer"],
    stats: {
      totalAffiliates: 0,
      totalCommissionPaid: 0,
      activeAffiliates: 0
    }
  })
  
  // Simulate fetching settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        
        // Fetch integration settings
        const integrationsResponse = await fetch('/api/admin/settings/integrations')
        
        if (integrationsResponse.ok) {
          const data = await integrationsResponse.json()
          
          // Update integration settings
          setApiKey(data.api_key)
          setStripeConnected(data.stripe.connected)
          setStripeKey(data.stripe.publishable_key)
          setEmailProvider(data.email.provider)
          setEmailConnected(data.email.connected)
          setEmailFromAddress(data.email.from_email)
          setAnalyticsConnected(data.analytics.connected)
          setAnalyticsId(data.analytics.tracking_id)
        }
        
        // Fetch affiliate settings
        try {
          const affiliateResponse = await fetch('/api/admin/settings/affiliate')
          if (affiliateResponse.ok) {
            const data = await affiliateResponse.json()
            setAffiliateSettings(data)
          }
        } catch (error) {
          console.error("Failed to fetch affiliate settings:", error)
        }
        
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])
  
  const handleSaveSettings = async () => {
    setSaving(true)
    
    try {
      // In a real app, save settings via API
      await fetch('/api/admin/settings/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site: {
            name: siteName,
            description: siteDescription,
            logoUrl: logoUrl,
            primaryColor: primaryColor
          },
          jobs: {
            expireDays: jobExpireDays,
            allowFeatured: allowFeaturedJobs,
            featuredPrice: featuredJobPrice
          }
        })
      })
      
      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }
  
  const handleRegenerateApiKey = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'regenerate_api_key'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.api_key)
        toast.success("API key regenerated successfully")
      } else {
        toast.error("Failed to regenerate API key")
      }
    } catch (error) {
      console.error("Failed to regenerate API key:", error)
      toast.error("Failed to regenerate API key")
    } finally {
      setSaving(false)
    }
  }
  
  const handleConfigureStripe = () => {
    // Open Stripe configuration modal
    setStripeModalOpen(true)
  }
  
  const handleConfigureEmail = () => {
    // Open email configuration modal
    setEmailModalOpen(true)
  }
  
  const handleConfigureAnalytics = () => {
    // Open analytics configuration modal - for now just show toast
    toast.info("Google Analytics configuration coming soon")
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
          <AffiliateSettingsTab initialSettings={affiliateSettings} />
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
                  value={apiKey}
                  type="password"
                  readOnly
                />
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleRegenerateApiKey}>Regenerate</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Payment Provider</h3>
                    <p className="text-sm text-muted-foreground">Stripe</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${stripeConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                      {stripeConnected ? 'Connected' : 'Not Connected'}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleConfigureStripe}>Configure</Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Provider</h3>
                    <p className="text-sm text-muted-foreground">{emailProvider === 'resend' ? 'Resend' : 'Injust'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${emailConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                      {emailConnected ? 'Connected' : 'Not Connected'}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleConfigureEmail}>Configure</Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Google Analytics</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${analyticsConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                      {analyticsConnected ? 'Connected' : 'Not Connected'}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleConfigureAnalytics}>Configure</Button>
                  </div>
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
      
      {/* Configuration Modals */}
      <StripeConfigModal
        open={stripeModalOpen}
        onOpenChange={setStripeModalOpen}
        publishableKey={stripeKey}
        isConnected={stripeConnected}
      />
      
      <EmailConfigModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        currentProvider={emailProvider}
        fromEmail={emailFromAddress}
        isConnected={emailConnected}
      />
    </div>
  )
} 