 "use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function PaymentFilterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState(
    searchParams.get("status") || "PENDING"
  )
  
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || ""
  )
  
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || ""
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    
    if (status) params.set("status", status)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    
    router.push(`/admin/affiliate/payments?${params.toString()}`)
  }

  const clearFilters = () => {
    setStatus("PENDING")
    setStartDate("")
    setEndDate("")
    router.push("/admin/affiliate/payments")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
        <Input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[180px]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
        <Input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[180px]"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Apply Filters</Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </form>
  )
}