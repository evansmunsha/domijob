"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReactNode } from "react"

interface ScrollableTabsProps {
  defaultValue: string
  children: ReactNode
  tabItems: {
    value: string
    label: string
    content: ReactNode
  }[]
}

export function ScrollableTabs({ defaultValue, tabItems }: ScrollableTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="mt-8">
      <div className="relative w-full">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2 text-sm flex-shrink-0 whitespace-nowrap"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabItems.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
