"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CreditCard, Check } from "lucide-react";
import { CREDIT_PACKAGES } from "@/app/utils/credits";
import { purchaseAICredits } from "@/app/actions/aiCredits";
import { CreditBalanceContext } from "./credit-context";

export default function AICreditsPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const creditsBalance = useContext(CreditBalanceContext);

  const handlePurchase = async (packageId: string) => {
    try {
      setIsProcessing(packageId);
      await purchaseAICredits(packageId);
      // The purchaseAICredits server action will handle the redirect
    } catch (error) {
      console.error("Purchase error:", error);
      setIsProcessing(null);
    }
  };

  return (
    <div className="container py-10 max-w-6xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Credits
        </h1>
        <p className="text-muted-foreground">
          Purchase credits to access premium AI-powered features and tools
        </p>
      </div>
      
      <div className="mb-8 p-4 bg-primary/10 rounded-lg flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg">Your Current Balance</h2>
          <p className="text-sm text-muted-foreground">
            Use these credits for job matching, resume enhancement, and more
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{creditsBalance}</div>
          <Button asChild size="sm" className="mt-2">
            <a href="/ai-tools">
              Browse AI Tools
            </a>
          </Button>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Select a Credit Package</h2>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle>Basic Package</CardTitle>
            <CardDescription>
              Perfect for trying out AI features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{CREDIT_PACKAGES.basic.credits} Credits</div>
            <div className="text-2xl font-semibold text-primary mb-4">
              ${(CREDIT_PACKAGES.basic.price / 100).toFixed(2)}
            </div>
            
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Access to all AI tools</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Approximately 5 job matches</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>3 resume enhancements</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full group" 
              size="lg"
              onClick={() => handlePurchase("basic")}
              disabled={isProcessing === "basic"}
            >
              {isProcessing === "basic" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                  Purchase
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="relative border-2 border-primary shadow-md">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold rounded-full px-3 py-1">
            MOST POPULAR
          </div>
          <CardHeader>
            <CardTitle>Standard Package</CardTitle>
            <CardDescription>
              Best value for regular users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{CREDIT_PACKAGES.standard.credits} Credits</div>
            <div className="text-2xl font-semibold text-primary mb-4">
              ${(CREDIT_PACKAGES.standard.price / 100).toFixed(2)}
            </div>
            
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Access to all AI tools</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Approximately 15 job matches</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>10 resume enhancements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Save 13% compared to basic</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full group" 
              size="lg"
              onClick={() => handlePurchase("standard")}
              disabled={isProcessing === "standard"}
            >
              {isProcessing === "standard" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                  Purchase
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="relative border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle>Premium Package</CardTitle>
            <CardDescription>
              For power users and professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{CREDIT_PACKAGES.premium.credits} Credits</div>
            <div className="text-2xl font-semibold text-primary mb-4">
              ${(CREDIT_PACKAGES.premium.price / 100).toFixed(2)}
            </div>
            
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Access to all AI tools</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Approximately 50 job matches</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>33 resume enhancements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Save 40% compared to basic</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full group" 
              size="lg"
              onClick={() => handlePurchase("premium")}
              disabled={isProcessing === "premium"}
            >
              {isProcessing === "premium" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                  Purchase
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-12 bg-muted/50 p-6 rounded-lg space-y-4">
        <h3 className="text-xl font-semibold">How AI Credits Work</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="font-medium">1. Purchase Credits</div>
            <p className="text-sm text-muted-foreground">
              Select a package above that suits your needs and complete the secure checkout process.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-medium">2. Use AI Tools</div>
            <p className="text-sm text-muted-foreground">
              Credits are automatically deducted when you use AI features like job matching, resume enhancement, and more.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-medium">3. Track Your Balance</div>
            <p className="text-sm text-muted-foreground">
              Your current balance is displayed across the platform. Purchase more credits anytime you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 