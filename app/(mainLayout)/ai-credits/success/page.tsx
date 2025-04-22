"use client";

import { useContext } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { SuccessCreditBalanceContext } from "./layout";

export default function AICreditsSuccessPage() {
  const creditsBalance = useContext(SuccessCreditBalanceContext);

  return (
    <div className="container py-10 max-w-lg">
      <Card className="border-green-200 shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Purchase Successful!</CardTitle>
          <CardDescription>
            Your AI credits have been added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Your Current Balance</div>
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{creditsBalance}</span>
              <span className="text-lg text-muted-foreground">credits</span>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">What's Next?</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
                <span>Access AI-powered job matching to find perfect roles</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
                <span>Enhance your resume with AI suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
                <span>Create compelling job descriptions (for recruiters)</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 pt-0">
          <Button asChild variant="default" className="w-full">
            <a href="/ai-tools">
              Explore AI Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 