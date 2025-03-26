"use client"

import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import Image from "next/image"
import Logo from "@/public/logo.png"
import { Menu, BarChart, Users } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "./ThemeToggle"
import { useSession, signOut } from "next-auth/react"
import { NotificationCenter } from "./NotificationCenter"
import { UserDropdown } from "../UserDropdown"

export function Navbar() {
  const { data: session, status } = useSession()
  const isCompanyUser = session?.user?.userType === "COMPANY"

  return (
    <nav className="flex justify-between items-center py-5">
      <Link href="/" className="flex items-center gap-2">
        <Image src={Logo || "/placeholder.svg"} alt="MiJob Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold">
          Mi<span className="text-primary">Job</span>
        </h1>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-5">
        {!isCompanyUser && (
          <Link href="/jobs" className={buttonVariants({ variant: "ghost" })}>
            Find Jobs
          </Link>
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
      <div className="md:hidden flex items-center gap-4">
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
                Mi<span className="text-primary">Job</span>
              </SheetTitle>
              <SheetDescription>Find or post your next job opportunity</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 mt-6">
              {!isCompanyUser && (
                <Link
                  href="/jobs"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Find Jobs
                </Link>
              )}

              {isCompanyUser && (
                <>
                  <Link
                    href="/post-job"
                    className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Post a Job
                  </Link>
                  <Link
                    href="/company/analytics"
                    className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    <BarChart className="h-4 w-4 mr-2 inline-block" />
                    Analytics
                  </Link>
                  <Link
                    href="/company/potential-candidates"
                    className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
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
                    className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                  >
                    Profiles
                  </Link>
                  <Link
                    href={isCompanyUser ? "/company-dashboard" : "/dashboard"}
                    className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
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
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

