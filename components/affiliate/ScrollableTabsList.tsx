"use client"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReactNode } from "react"

interface TabItem {
  value: string
  label: ReactNode
}

interface ScrollableTabsListProps {
  tabs: TabItem[]
}

export function ScrollableTabsList({ tabs }: ScrollableTabsListProps) {
  return (
    <TabsList className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory mb-8">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0 px-4 py-2 whitespace-nowrap snap-start">
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
