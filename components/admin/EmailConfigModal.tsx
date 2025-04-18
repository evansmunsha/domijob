"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EmailConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProvider: string
  fromEmail: string
  isConnected: boolean
}

export function EmailConfigModal({
  open,
  onOpenChange,
  currentProvider,
  fromEmail,
  isConnected
}: EmailConfigModalProps) {
  const [provider, setProvider] = useState(currentProvider)
  const [apiKey, setApiKey] = useState("")
  const [fromAddress, setFromAddress] = useState(fromEmail)
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    try {
      setLoading(true)
      
      // In a production app, you would send this to your API
      await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          fromEmail: fromAddress
        })
      })
      
      toast.success(`${provider === 'resend' ? 'Resend' : 'Injust'} configured successfully`)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save email configuration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Provider Configuration</DialogTitle>
          <DialogDescription>
            Configure your email provider settings. This will be used for sending notifications,
            password resets, and other system emails.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={setProvider}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resend" id="resend" />
                <Label htmlFor="resend">Resend</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="injust" id="injust" />
                <Label htmlFor="injust">Injust</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key {isConnected && "(Already configured)"}</Label>
            <Input
              id="api-key"
              type="password"
              placeholder={isConnected ? "••••••••••••••••" : "Enter API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {provider === 'resend' 
                ? 'Find your Resend API key in your Resend dashboard.'
                : 'Find your Injust API key in your Injust account settings.'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email Address</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="noreply@yourdomain.com"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This email address will be used as the sender for all system emails.
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