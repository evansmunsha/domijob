"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Sparkles, ArrowLeft } from "lucide-react";

export default function AICreditsCancelPage() {
  return (
    <div className="container py-10 max-w-lg">
      <Card className="border-orange-200 shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto mb-4 bg-orange-100 rounded-full p-3 w-fit">
            <XCircle className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Purchase Cancelled</CardTitle>
          <CardDescription>
            Your AI credits purchase was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">Did you encounter any issues?</h3>
            <p className="text-sm text-muted-foreground">
              If you experienced technical difficulties or have questions about our AI credit system, 
              please contact our support team at munshastripe@gmail.com
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Why AI Credits?
            </h3>
            <p className="text-sm text-muted-foreground">
              AI credits power our premium features like job matching, resume enhancement, and job description optimization. 
              These tools can significantly improve your chances of finding the perfect job or candidate.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 pt-4">
          <Button asChild variant="outline" className="w-full">
            <a href="/ai-tools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to AI Tools
            </a>
          </Button>
          <Button asChild variant="default" className="w-full">
            <a href="/ai-credits">
              Try Again
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 