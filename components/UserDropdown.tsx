"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Briefcase, Building2, BarChart, Users } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface UserDropdownProps {
  name: string
  email: string
  image: string
  userType: "COMPANY" | "JOB_SEEKER"
}

export function UserDropdown({ name, email, image, userType }: UserDropdownProps) {
  const isCompanyUser = userType === "COMPANY"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src={image || `https://avatar.vercel.sh/${name}`} alt={name} />
          <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={isCompanyUser ? `/company-profile` : "/profile"} className="cursor-pointer flex w-full">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={isCompanyUser ? "/company-dashboard" : "/dashboard"} className="cursor-pointer flex w-full">
            {isCompanyUser ? <Building2 className="mr-2 h-4 w-4" /> : <Briefcase className="mr-2 h-4 w-4" />}
            Dashboard
          </Link>
        </DropdownMenuItem>
        {isCompanyUser && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/post-job" className="cursor-pointer flex w-full">
                <Briefcase className="mr-2 h-4 w-4" />
                Post Job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/company/analytics" className="cursor-pointer flex w-full">
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/company/potential-candidates" className="cursor-pointer flex w-full">
                <Users className="mr-2 h-4 w-4" />
                Potential Candidates
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer flex w-full">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

