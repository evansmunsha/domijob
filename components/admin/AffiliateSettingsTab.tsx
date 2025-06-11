"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { AffiliateConfigModal } from "./AffiliateConfigModal"

const formSchema = z.object({
  enableAffiliate: z.boolean().default(false),
})

type AffiliateSettings = {
  enabled: boolean
  commissionRate: number
  minPayout: number
  payoutMethods: string[]
  stats?: {
    totalAffiliates: number
    totalCommissionPaid: number
    activeAffiliates: number
  }
}

interface AffiliateSettingsTabProps {
  initialSettings?: AffiliateSettings
}

export function AffiliateSettingsTab({ 
  initialSettings = {
    enabled: false,
    commissionRate: 10,
    minPayout: 50,
    payoutMethods: ["paypal", "bank_transfer"],
    stats: {
      totalAffiliates: 0,
      totalCommissionPaid: 0,
      activeAffiliates: 0
    }
  }
}: AffiliateSettingsTabProps) {
  const [loading, setLoading] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [settings, setSettings] = useState<AffiliateSettings>(initialSettings)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enableAffiliate: initialSettings.enabled,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/settings/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: values.enableAffiliate,
          commissionRate: settings.commissionRate,
          minPayout: settings.minPayout,
          payoutMethods: settings.payoutMethods
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update settings")
      }

      const data = await response.json()
      setSettings({
        ...settings,
        enabled: values.enableAffiliate
      })
      
      toast.success("Affiliate settings updated successfully")
    } catch (error) {
      console.error("Error saving affiliate settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSave = (newSettings: Partial<AffiliateSettings>) => {
    setSettings({ ...settings, ...newSettings })
    form.setValue("enableAffiliate", newSettings.enabled ?? settings.enabled)
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Program</CardTitle>
              <CardDescription>
                Configure your affiliate program settings. Enable users to promote your platform and earn commissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableAffiliate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Affiliate Program</FormLabel>
                      <FormDescription>
                        Allow users to sign up as affiliates and earn commissions for referrals
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Program Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your affiliate program settings, commission rates, and payout methods
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Commission Rate</span>
                    <p className="text-2xl font-bold">{settings.commissionRate}%</p>
                    <p className="text-xs text-muted-foreground">Default rate for all affiliates</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Minimum Payout</span>
                    <p className="text-2xl font-bold">${settings.minPayout}</p>
                    <p className="text-xs text-muted-foreground">Threshold for payment requests</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Payment Methods</span>
                    <p className="text-lg font-medium">
                      {settings.payoutMethods.map(method => 
                        method === 'paypal' ? 'PayPal' :
                        method === 'bank_transfer' ? 'Bank Transfer' :
                        method === 'crypto' ? 'Crypto' :
                        method === 'check' ? 'Check' : method
                      ).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">Available payout options</p>
                  </div>
                </div>
              </div>
              
              {settings.stats && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Program Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Total Affiliates</span>
                      <p className="text-2xl font-bold">{settings.stats.totalAffiliates}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Active Affiliates</span>
                      <p className="text-2xl font-bold">{settings.stats.activeAffiliates}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Total Commission Paid</span>
                      <p className="text-2xl font-bold">${settings.stats.totalCommissionPaid.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      <AffiliateConfigModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        enabled={settings.enabled}
        commissionRate={settings.commissionRate}
        minPayout={settings.minPayout}
        payoutMethods={settings.payoutMethods}
      />
    </div>
  )
} 