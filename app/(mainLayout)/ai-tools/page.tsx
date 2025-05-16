import { Metadata } from "next";
import { auth } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, FileEdit, Search, FileText, ArrowRight, Gift } from 'lucide-react';
import { getUserCreditStatus } from "@/app/actions/aiCredits";
import { use } from "react";
import { CreditStatus } from "@/components/credit-status";

export const metadata: Metadata = {
  title: "AI Tools",
  description: "AI-powered tools to enhance your job search and application process",
};

export default function AIToolsPage() {
  const session = use(auth());

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { balance, isNewUser } = use(getUserCreditStatus());

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Tools
        </h1>
        <p className="text-muted-foreground">
          Powered by OpenAI's technology to enhance your job search and application process
        </p>
      </div>

      {/* Credit Status Component */}
      <div className="mb-8">
        <CreditStatus />
      </div>

      {/* New User Welcome Card */}
      {isNewUser && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Welcome to Our AI Tools!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We've given you <span className="font-bold">50 free credits</span> to explore our AI-powered features.
              Here's what you can do with your credits:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Find the perfect job matches (10 credits per use)</li>
              <li>Enhance your resume to stand out (15 credits per use)</li>
              <li>Create compelling job descriptions (20 credits per use)</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              AI Job Matcher
            </CardTitle>
            <CardDescription>
              Find the perfect jobs matching your skills and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your resume and matches it with job postings to find the best opportunities for you.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                10 credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/ai-tools/job-matcher">
                Get Matched
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-primary" />
              Resume Enhancer
            </CardTitle>
            <CardDescription>
              Improve your resume for better job applications
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Get personalized suggestions to optimize your resume for ATS systems and increase your chances of landing interviews.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                15 credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/ai-tools/resume-enhancer">
                Enhance Resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Job Description Enhancer
            </CardTitle>
            <CardDescription>
              Create compelling job descriptions for recruiters
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Improve your job postings with AI-enhanced descriptions that attract qualified candidates.
              Available when creating or editing job posts.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                20 credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full" variant="outline">
              <Link href="/post-job">
                Post a Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 