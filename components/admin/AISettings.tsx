"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AISettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    model: "gpt-4o-mini",
    maxTokens: 1000,
    monthlyCostLimit: 50,
    usage: {
      monthlyTokens: 0,
      monthlyCost: 0
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/ai");
      
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast.error("Failed to load AI settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch("/api/admin/settings/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          model: settings.model,
          maxTokens: settings.maxTokens,
          monthlyCostLimit: settings.monthlyCostLimit
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }
      
      toast.success("AI settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>
          Configure the AI features for job matching and content enhancement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-enabled" className="text-base">Enable AI Features</Label>
            <Switch
              id="ai-enabled"
              checked={settings.enabled}
              onCheckedChange={(value) => setSettings({...settings, enabled: value})}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {settings.enabled 
              ? "AI features are currently active" 
              : "AI features are currently disabled"}
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-model">OpenAI Model</Label>
            <Select 
              value={settings.model} 
              onValueChange={(value) => setSettings({...settings, model: value})}
              disabled={!settings.enabled}
            >
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (Higher quality, higher cost)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              GPT-4o Mini offers excellent performance with better cost efficiency
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="max-tokens">Maximum Tokens per Request</Label>
            <Input
              id="max-tokens"
              type="number"
              value={settings.maxTokens}
              onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value) || 0})}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Higher values allow for more detailed responses but increase costs
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="cost-limit">Monthly Cost Limit ($)</Label>
            <Input
              id="cost-limit"
              type="number"
              min="0"
              step="0.01"
              value={settings.monthlyCostLimit}
              onChange={(e) => setSettings({...settings, monthlyCostLimit: parseFloat(e.target.value) || 0})}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Set a monthly budget limit for AI usage (0 for no limit)
            </p>
          </div>
        </div>
        
        <div className="rounded-md bg-muted p-4">
          <div className="text-sm font-medium mb-2">Current Usage Statistics</div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{settings.usage.monthlyTokens.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Tokens This Month</div>
            </div>
            <div>
              <div className="text-2xl font-bold">${settings.usage.monthlyCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Cost This Month</div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start">
            <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              <p className="mb-1">GPT-4o Mini offers:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Better performance than GPT-3.5 Turbo</li>
                <li>5x more cost-effective than GPT-4</li>
                <li>Improved understanding of job descriptions and skills</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save AI Settings
        </Button>
      </CardContent>
    </Card>
  );
} 