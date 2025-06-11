"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface StripeConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  publishableKey: string
  isConnected: boolean
}

export function StripeConfigModal({
  open,
  onOpenChange,
  publishableKey,
  isConnected
}: StripeConfigModalProps) {
  const [pubKey, setPubKey] = useState(publishableKey)
  const [secretKey, setSecretKey] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    try {
      setLoading(true)
      
      // In a production app, you would send this to your API
      await fetch('/api/admin/settings/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publishableKey: pubKey,
          secretKey: secretKey || undefined,
          webhookSecret: webhookSecret || undefined
        })
      })
      
      toast.success("Stripe configured successfully")
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save Stripe configuration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stripe Configuration</DialogTitle>
          <DialogDescription>
            Configure Stripe for processing payments. This will be used for featured job listings and affiliate payouts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publishable-key">Publishable Key</Label>
            <Input
              id="publishable-key"
              placeholder="pk_live_..."
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secret-key">Secret Key {isConnected && "(Already configured)"}</Label>
            <Input
              id="secret-key"
              type="password"
              placeholder={isConnected ? "••••••••••••••••" : "sk_live_..."}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Stripe secret key is never stored in the browser.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret {isConnected && "(Already configured)"}</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder={isConnected ? "••••••••••••••••" : "whsec_..."}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Create a webhook in your Stripe dashboard pointed to: https://yourdomain.com/api/webhooks/stripe
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 