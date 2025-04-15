"use client"

import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import Image from "next/image"
import Logo from "@/public/logo.png"
import { Menu, BarChart, Users, MessageSquare, Share2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "./ThemeToggle"
import { useSession, signOut } from "next-auth/react"
import { NotificationCenter } from "./NotificationCenter"
import { UserDropdown } from "../UserDropdown"
import { UnreadMessagesIndicator } from "../messages/UnreadMessagesIndicator"

export function Navbar() {
  const { data: session, status } = useSession()
  const isCompanyUser = session?.user?.userType === "COMPANY"

  return (
    <nav className="flex justify-between items-center py-5">
      <Link href="/" className="flex items-center gap-2">
        <Image src={Logo || "/placeholder.svg"} alt="domijob Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold">
        Do<span className="text-primary">MiJob</span>
        </h1>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-5">
        {!isCompanyUser && (
          <>
            <Link href="/jobs" className={buttonVariants({ variant: "ghost" })}>
              Find Jobs
            </Link>

            <Link href="/messages" className="text-gray-300 hover:text-green-500">
              Messages <UnreadMessagesIndicator />
            </Link>

            <Link href="/affiliate" className={buttonVariants({ variant: "ghost" })}>
              <Share2 className="h-4 w-4 mr-2" />
              Affiliate
            </Link>
          </>
        )}

        {isCompanyUser && (
          <>
            <Link href="/company/analytics" className={buttonVariants({ variant: "ghost" })}>
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Link>
            <Link href="/company/potential-candidates" className={buttonVariants({ variant: "ghost" })}>
              <Users className="h-4 w-4 mr-2" />
              Candidates
            </Link>

            <Link href="/messages" className="text-gray-300 hover:text-green-500">
              Messages <UnreadMessagesIndicator />
            </Link>
          </>
        )}

        {!isCompanyUser && <NotificationCenter />}

        {isCompanyUser && (
          <>
            <NotificationCenter />
            <Link href="/post-job" className={buttonVariants({ size: "default" })}>
              Post Job
            </Link>
          </>
        )}

        <ThemeToggle />

        {status === "authenticated" && session?.user ? (
          <UserDropdown
            email={session.user.email as string}
            name={session.user.name as string}
            image={session.user.image as string}
            userType={session.user.userType as "COMPANY" | "JOB_SEEKER"}
          />
        ) : (
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "default" })}>
            Login
          </Link>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center gap-2">
        {isCompanyUser && <NotificationCenter />}
        {!isCompanyUser && <NotificationCenter />}
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="text-left">
              <SheetTitle>
                Do<span className="text-primary">MiJob</span>
              </SheetTitle>
              <SheetDescription>Find or post your next job opportunity</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-2 mt-6">
              {!isCompanyUser && (
                
                <>
                  <Link
                    href="/jobs"
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Find Jobs
                  </Link>
                  
                </>
              )}

              {isCompanyUser && (
                <>
                  <Link
                    href="/post-job"
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Post a Job
                  </Link>
                  
                  <Link
                    href="/company/analytics"
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    <BarChart className="h-4 w-4 mr-2 inline-block" />
                    Analytics
                  </Link>
                  <Link
                    href="/company/potential-candidates"
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    <Users className="h-4 w-4 mr-2 inline-block" />
                    Potential Candidates
                  </Link>
                </>
              )}

              {status === "authenticated" && session?.user ? (
                <>
                  <Link
                    href={isCompanyUser ? `/company-profile` : "/profile"}
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Profiles
                  </Link>
                  <Link
                    href={isCompanyUser ? "/company-dashboard" : "/dashboard"}
                    className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Login
                </Link>
              )}

          <Link href="/messages" className="text-sm px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200 flex flex-wrap items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
            <UnreadMessagesIndicator />
          </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

