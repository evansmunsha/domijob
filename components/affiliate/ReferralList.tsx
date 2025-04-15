"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Referral {
  id: string
  referredUserId: string
  commissionAmount: number
  status: string
  createdAt: string
  convertedAt?: string
}

interface ReferralListProps {
  referrals: Referral[]
}

export function ReferralList({ referrals }: ReferralListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Converted At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>{format(new Date(referral.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>{referral.referredUserId}</TableCell>
              <TableCell>${referral.commissionAmount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={referral.status === "CONVERTED" ? "default" : "secondary"}>
                  {referral.status}
                </Badge>
              </TableCell>
              <TableCell>
                {referral.convertedAt
                  ? format(new Date(referral.convertedAt), "MMM d, yyyy")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 