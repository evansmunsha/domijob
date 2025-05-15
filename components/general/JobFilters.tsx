"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Filter, X, Briefcase, MapPin, Building2, Sparkles } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Checkbox } from "../ui/checkbox"
import { countryList } from "@/app/utils/countriesList"
import { Separator } from "../ui/separator"
import { motion } from "framer-motion"

export function JobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExpanded, setIsExpanded] = useState(false)

  const jobTypes = ["full-time", "part-time", "contract", "internship"]

  // Get current filters from URL
  const currentJobTypes = searchParams.get("jobTypes")?.split(",") || []
  const currentLocation = searchParams.get("location") || ""

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }

      return params.toString()
    },
    [searchParams],
  )

  const handleJobTypeChange = (type: string, checked: boolean) => {
    const current = new Set(currentJobTypes)
    if (checked) {
      current.add(type)
    } else {
      current.delete(type)
    }

    const newValue = Array.from(current).join(",")
    router.push(`?${createQueryString("jobTypes", newValue)}`, { scroll: false })
  }

  const handleLocationChange = (location: string) => {
    router.push(`?${createQueryString("location", location)}`, { scroll: false })
  }

  const clearFilters = () => {
    router.push("/", { scroll: false })
  }

  
  const handleCompanyClick = (company: string) => {
    // This would typically filter by company, but for now just show a toast
    console.log(`Filtering by company: ${company}`)
    // You could implement this by adding a company filter parameter
    // router.push(`?${createQueryString("company", company)}`)
  }

  const hasActiveFilters = currentJobTypes.length > 0 || currentLocation

  return (
    <Card className="sticky top-4 border-0 shadow-md overflow-hidden">
      <CardHeader className="space-y-0 p-0">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Jobs
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="destructive" size="sm" className="h-8 rounded-md" onClick={clearFilters}>
              <span className="mr-1">Clear</span>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden p-2 border-b">
          <Button variant="ghost" className="w-full justify-between" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Hide Filters" : "Show Filters"}
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </motion.div>
          </Button>
        </div>
      </CardHeader>

      <motion.div
        className="md:block"
        initial={{ height: "auto" }}
        animate={{ height: isExpanded || window.innerWidth >= 768 ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        <CardContent className="space-y-6 p-4">
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Job Type
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {jobTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.toLowerCase()}
                    checked={currentJobTypes.includes(type)}
                    onCheckedChange={(checked) => handleJobTypeChange(type, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label
                    htmlFor={type.toLowerCase()}
                    className="text-sm font-medium leading-none capitalize cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Location
            </Label>
            <Select value={currentLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Worldwide</SelectLabel>
                  <SelectItem value="worldwide">
                    <div className="flex items-center">
                      <span className="mr-2">🌍</span>
                      <span>Worldwide / Remote</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Popular Locations</SelectLabel>
                  <SelectItem value="United States">
                    <div className="flex items-center">
                      <span className="mr-2">🇺🇸</span>
                      <span>United States</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="United Kingdom">
                    <div className="flex items-center">
                      <span className="mr-2">🇬🇧</span>
                      <span>United Kingdom</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Canada">
                    <div className="flex items-center">
                      <span className="mr-2">🇨🇦</span>
                      <span>Canada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Australia">
                    <div className="flex items-center">
                      <span className="mr-2">🇦🇺</span>
                      <span>Australia</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>All Countries</SelectLabel>
                  {countryList.map((country) => (
                    <SelectItem value={country.name} key={country.name}>
                      <div className="flex items-center">
                        <span className="mr-2">{country.flagEmoji}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              Popular Companies
            </Label>
            <div className="flex flex-wrap gap-2">
              {["Microsoft", "Google", "Amazon", "Apple", "Meta"].map((company) => (
                <Button
                  key={company}
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-md"
                  onClick={() => handleCompanyClick(company)}
                >
                  {company}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </motion.div>
    </Card>
  )
}
