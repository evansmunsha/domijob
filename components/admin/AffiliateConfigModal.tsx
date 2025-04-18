"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface AffiliateConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabled: boolean
  commissionRate: number
  minPayout: number
  payoutMethods?: string[]
}

export function AffiliateConfigModal({
  open,
  onOpenChange,
  enabled: initialEnabled = true,
  commissionRate: initialCommissionRate = 10,
  minPayout: initialMinPayout = 50,
  payoutMethods: initialPayoutMethods = ["paypal", "bank_transfer"]
}: AffiliateConfigModalProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [commissionRate, setCommissionRate] = useState(initialCommissionRate)
  const [minPayout, setMinPayout] = useState(initialMinPayout)
  const [payoutMethods, setPayoutMethods] = useState<string[]>(initialPayoutMethods)
  const [saving, setSaving] = useState(false)

  const handlePayoutMethodToggle = (method: string) => {
    if (payoutMethods.includes(method)) {
      setPayoutMethods(payoutMethods.filter(m => m !== method))
    } else {
      setPayoutMethods([...payoutMethods, method])
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate fields
      if (commissionRate < 1 || commissionRate > 90) {
        toast.error("Commission rate must be between 1% and 90%")
        return
      }
      
      if (minPayout < 10 || minPayout > 1000) {
        toast.error("Minimum payout must be between $10 and $1000")
        return
      }
      
      if (payoutMethods.length === 0) {
        toast.error("At least one payout method is required")
        return
      }
      
      // Save settings
      const response = await fetch('/api/admin/settings/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          commissionRate,
          minPayout,
          payoutMethods
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save affiliate settings")
      }
      
      toast.success("Affiliate settings saved successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving affiliate settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Affiliate Program Configuration</DialogTitle>
          <DialogDescription>
            Configure your affiliate program settings. These settings will apply to all affiliates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="affiliate-enabled">Enable Affiliate Program</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to join the affiliate program
              </p>
            </div>
            <Switch 
              id="affiliate-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              min="1"
              max="90"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              The percentage of each sale that affiliates earn as commission
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-payout">Minimum Payout Amount ($)</Label>
            <Input
              id="min-payout"
              type="number"
              min="10"
              max="1000"
              value={minPayout}
              onChange={(e) => setMinPayout(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount required before affiliates can request a payout
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-base">Available Payment Methods</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="method-paypal" 
                  checked={payoutMethods.includes('paypal')}
                  onCheckedChange={() => handlePayoutMethodToggle('paypal')}
                />
                <label
                  htmlFor="method-paypal"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  PayPal
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="method-bank" 
                  checked={payoutMethods.includes('bank_transfer')}
                  onCheckedChange={() => handlePayoutMethodToggle('bank_transfer')}
                />
                <label
                  htmlFor="method-bank"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bank Transfer
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="method-crypto" 
                  checked={payoutMethods.includes('crypto')}
                  onCheckedChange={() => handlePayoutMethodToggle('crypto')}
                />
                <label
                  htmlFor="method-crypto"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cryptocurrency
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="method-check" 
                  checked={payoutMethods.includes('check')}
                  onCheckedChange={() => handlePayoutMethodToggle('check')}
                />
                <label
                  htmlFor="method-check"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Check
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}