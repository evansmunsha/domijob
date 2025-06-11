"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  payoutMethods: string[]
}

export function AffiliateConfigModal({
  open,
  onOpenChange,
  enabled: initialEnabled,
  commissionRate: initialCommissionRate,
  minPayout: initialMinPayout,
  payoutMethods: initialPayoutMethods
}: AffiliateConfigModalProps) {
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [commissionRate, setCommissionRate] = useState(initialCommissionRate)
  const [minPayout, setMinPayout] = useState(initialMinPayout)
  const [payoutMethods, setPayoutMethods] = useState<string[]>(initialPayoutMethods)

  const handlePayoutMethodToggle = (method: string) => {
    setPayoutMethods(current => {
      if (current.includes(method)) {
        // Don't remove if it's the last method
        if (current.length === 1) {
          toast.error("At least one payout method is required")
          return current
        }
        return current.filter(m => m !== method)
      } else {
        return [...current, method]
      }
    })
  }

  const handleSave = async () => {
    // Validate the input
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error("Commission rate must be between 0 and 100")
      return
    }
    
    if (minPayout < 0) {
      toast.error("Minimum payout amount must be a positive number")
      return
    }
    
    if (payoutMethods.length === 0) {
      toast.error("At least one payout method is required")
      return
    }
    
    try {
      setSaving(true)
      
      const response = await fetch("/api/admin/settings/affiliate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        throw new Error(data.error || "Failed to save settings")
      }
      
      toast.success("Affiliate settings updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update settings")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Affiliate Program Configuration</DialogTitle>
          <DialogDescription>
            Configure the affiliate program settings for your platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid gap-2 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled" className="text-base">Enable Affiliate Program</Label>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {enabled ? "The affiliate program is currently active" : "The affiliate program is currently disabled"}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                disabled={!enabled}
              />
              <p className="text-sm text-muted-foreground">
                The percentage of sale value that affiliates earn for each conversion.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="minPayout">Minimum Payout Amount ($)</Label>
              <Input
                id="minPayout"
                type="number"
                min="0"
                value={minPayout}
                onChange={(e) => setMinPayout(Number(e.target.value))}
                disabled={!enabled}
              />
              <p className="text-sm text-muted-foreground">
                The minimum amount an affiliate must earn before requesting payment.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label className="mb-2">Available Payout Methods</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="paypal"
                    checked={payoutMethods.includes("paypal")}
                    onCheckedChange={() => handlePayoutMethodToggle("paypal")}
                    disabled={!enabled}
                  />
                  <label 
                    htmlFor="paypal"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    PayPal
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bank_transfer"
                    checked={payoutMethods.includes("bank_transfer")}
                    onCheckedChange={() => handlePayoutMethodToggle("bank_transfer")}
                    disabled={!enabled}
                  />
                  <label 
                    htmlFor="bank_transfer"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bank Transfer
                  </label>
                </div>
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}