"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ArrowUpDown, X } from "lucide-react"
import { countryList } from "@/app/utils/countriesList"

interface JobSearchProps {
  initialSearch?: string
  initialJobTypes?: string[]
  initialLocation?: string
  initialSortBy?: string
}

export function JobSearch({
  initialSearch = "",
  initialJobTypes = [],
  initialLocation = "",
  initialSortBy = "newest",
}: JobSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const [jobTypes, setJobTypes] = useState<string[]>(initialJobTypes)
  const [location, setLocation] = useState(initialLocation)
  const [sortBy, setSortBy] = useState(initialSortBy)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Job type options
  const jobTypeOptions = [
    { id: "full-time", label: "Full-time" },
    { id: "part-time", label: "Part-time" },
    { id: "contract", label: "Contract" },
    { id: "internship", label: "Internship" },
  ]

  // Sort options
  const sortOptions = [
    { id: "newest", label: "Newest first" },
    { id: "oldest", label: "Oldest first" },
    { id: "salary-high", label: "Highest salary" },
    { id: "salary-low", label: "Lowest salary" },
  ]

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  // Handle job type checkbox change
  const handleJobTypeChange = (checked: boolean, type: string) => {
    if (checked) {
      setJobTypes([...jobTypes, type])
    } else {
      setJobTypes(jobTypes.filter((t) => t !== type))
    }
  }

  // Handle location change
  const handleLocationChange = (value: string) => {
    setLocation(value)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value)
    setIsSortOpen(false)
    applyFilters({ sortBy: value })
  }

  // Apply filters
  const applyFilters = (overrides: any = {}) => {
    const params = new URLSearchParams()

    const searchValue = overrides.search !== undefined ? overrides.search : search
    const jobTypesValue = overrides.jobTypes !== undefined ? overrides.jobTypes : jobTypes
    const locationValue = overrides.location !== undefined ? overrides.location : location
    const sortByValue = overrides.sortBy !== undefined ? overrides.sortBy : sortBy

    if (searchValue) params.set("search", searchValue)
    if (jobTypesValue.length > 0) params.set("jobTypes", jobTypesValue.join(","))
    if (locationValue) params.set("location", locationValue)
    if (sortByValue) params.set("sortBy", sortByValue)

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  // Handle filter apply
  const handleApplyFilter = () => {
    setIsFilterOpen(false)
    applyFilters()
  }

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearch("")
    setJobTypes([])
    setLocation("")
    setSortBy("newest")
    setIsFilterOpen(false)

    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }

    startTransition(() => {
      router.push(pathname)
    })
  }

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search jobs by title or keyword..."
            defaultValue={search}
            onChange={handleSearchChange}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                if (searchInputRef.current) {
                  searchInputRef.current.value = ""
                  searchInputRef.current.focus()
                }
                applyFilters({ search: "" })
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary" className="h-10 gap-2 relative">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(jobTypes.length > 0 || location) && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {jobTypes.length + (location ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Job Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {jobTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`job-type-${option.id}`}
                        checked={jobTypes.includes(option.id)}
                        onCheckedChange={(checked) => handleJobTypeChange(checked as boolean, option.id)}
                      />
                      <Label htmlFor={`job-type-${option.id}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Location</h3>
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any location</SelectItem>
                    <SelectItem value="worldwide">Worldwide / Remote</SelectItem>
                    {countryList.map((country) => (
                      <SelectItem key={country.name} value={country.name}>
                        <span className="mr-2">{country.flagEmoji}</span>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear all
                </Button>
                <Button type="button" size="sm" onClick={handleApplyFilter} className="bg-green-600 hover:bg-green-700">
                  Apply filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary" className="h-10 gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <div className="flex flex-col">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  className={`px-4 py-2 text-left hover:bg-muted transition-colors ${
                    sortBy === option.id ? "bg-muted font-medium" : ""
                  }`}
                  onClick={() => handleSortChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type="submit" className="h-10 bg-green-600 hover:bg-green-700" disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* Active filters */}
      {(search || jobTypes.length > 0 || location) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {search && (
            <Badge
              className="bg-white/20 text-white hover:bg-white/30 gap-1 px-3 py-1"
              onClick={() => {
                setSearch("")
                if (searchInputRef.current) {
                  searchInputRef.current.value = ""
                }
                applyFilters({ search: "" })
              }}
            >
              <span>Search: {search}</span>
              <X className="h-3 w-3" />
            </Badge>
          )}

          {jobTypes.map((type) => {
            const label = jobTypeOptions.find((opt) => opt.id === type)?.label || type
            return (
              <Badge
                key={type}
                className="bg-white/20 text-white hover:bg-white/30 gap-1 px-3 py-1"
                onClick={() => {
                  const newJobTypes = jobTypes.filter((t) => t !== type)
                  setJobTypes(newJobTypes)
                  applyFilters({ jobTypes: newJobTypes })
                }}
              >
                <span>{label}</span>
                <X className="h-3 w-3" />
              </Badge>
            )
          })}

          {location && (
            <Badge
              className="bg-white/20 text-white hover:bg-white/30 gap-1 px-3 py-1"
              onClick={() => {
                setLocation("")
                applyFilters({ location: "" })
              }}
            >
              <span>Location: {location}</span>
              <X className="h-3 w-3" />
            </Badge>
          )}

          <Button
            variant="link"
            className="text-white/80 hover:text-white p-0 h-auto text-xs"
            onClick={handleClearFilters}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
