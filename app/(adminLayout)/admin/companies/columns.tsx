"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Company = {
  id: string
  name: string
  email: string | null
  website: string | null
  status: string | null
  verified: boolean
  jobCount: number
  createdAt: Date
  updatedAt: Date
}

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: "Company Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const website = row.getValue("website") as string | null
      
      if (!website) return null

      return (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:underline"
        >
          {website.replace(/^https?:\/\//, '')}
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      )
    },
  },
  {
    accessorKey: "verified",
    header: "Verification",
    cell: ({ row }) => {
      const verified = row.getValue("verified") as boolean
      
      return (
        <Badge variant={verified ? "default" : "secondary"}>
          {verified ? "Verified" : "Unverified"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "jobCount",
    header: "Active Jobs",
    cell: ({ row }) => {
      const count = row.getValue("jobCount") as number
      return count
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return format(date, "MMM dd, yyyy")
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(company.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>View Jobs</DropdownMenuItem>
            <DropdownMenuItem>Edit Company</DropdownMenuItem>
            {!company.verified && (
              <DropdownMenuItem>Verify Company</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 