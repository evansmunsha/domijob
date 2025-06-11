"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Referral {
  id: string
  createdAt: string
  status: string
  commissionAmount: number
  referredUserId: string
}

interface ReferralListProps {
  referrals: Referral[]
}

export function ReferralList({ referrals }: ReferralListProps) {
  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // Get status color class based on status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONVERTED':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
      case 'PAID':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  // Calculate total earnings from referrals
  const totalEarnings = referrals.reduce((sum, referral) => sum + referral.commissionAmount, 0)

  // Calculate conversions by date
  const getConversionsByMonth = () => {
    const months: Record<string, number> = {}
    referrals.forEach(referral => {
      const date = new Date(referral.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[month] = (months[month] || 0) + 1
    })
    return months
  }

  const conversionsByMonth = getConversionsByMonth()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No referrals yet.</p>
            <p className="text-sm mt-1">Share your affiliate links to start earning commissions.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Referrals</div>
                <div className="text-2xl font-bold mt-1">{referrals.length}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Earnings</div>
                <div className="text-2xl font-bold mt-1">${totalEarnings.toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Average Commission</div>
                <div className="text-2xl font-bold mt-1">
                  ${referrals.length ? (totalEarnings / referrals.length).toFixed(2) : "0.00"}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium">Date</th>
                    <th className="py-3 text-left font-medium">User ID</th>
                    <th className="py-3 text-left font-medium">Status</th>
                    <th className="py-3 text-left font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b">
                      <td className="py-3">{formatDate(referral.createdAt)}</td>
                      <td className="py-3">{referral.referredUserId.substring(0, 8)}...</td>
                      <td className="py-3">
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </td>
                      <td className="py-3">${referral.commissionAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {Object.keys(conversionsByMonth).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Monthly Conversions</h3>
                <div className="space-y-2">
                  {Object.entries(conversionsByMonth)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([month, count]) => {
                      const [year, monthNum] = month.split('-')
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' })
                      return (
                        <div key={month} className="flex justify-between items-center">
                          <span>{monthName} {year}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 