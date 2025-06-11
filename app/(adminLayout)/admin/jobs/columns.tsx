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

export type Job = {
  id: string
  title: string
  companyName: string
  companyId: string
  location: string | null
  salary: string | null
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED"
  applicationsCount: number
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "title",
    header: "Job Title",
  },
  {
    accessorKey: "companyName",
    header: "Company",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
      
      switch(status) {
        case "ACTIVE":
          variant = "default"
          break
        case "DRAFT":
          variant = "secondary"
          break
        case "CLOSED":
          variant = "outline"
          break
        case "EXPIRED":
          variant = "destructive"
          break
      }
      
      return (
        <Badge variant={variant}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "featured",
    header: "Featured",
    cell: ({ row }) => {
      const featured = row.getValue("featured") as boolean
      
      return featured ? (
        <Badge variant="default" className="bg-amber-500">Featured</Badge>
      ) : null
    },
  },
  {
    accessorKey: "applicationsCount",
    header: "Applications",
  },
  {
    accessorKey: "createdAt",
    header: "Posted",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return format(date, "MMM dd, yyyy")
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original

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
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Job</DropdownMenuItem>
            <DropdownMenuItem>View Applications</DropdownMenuItem>
            <DropdownMenuItem>Edit Job</DropdownMenuItem>
            {job.status === "ACTIVE" ? (
              <DropdownMenuItem className="text-red-600">Close Job</DropdownMenuItem>
            ) : job.status === "CLOSED" ? (
              <DropdownMenuItem className="text-green-600">Reactivate Job</DropdownMenuItem>
            ) : null}
            {!job.featured && (
              <DropdownMenuItem className="text-amber-600">Feature Job</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 