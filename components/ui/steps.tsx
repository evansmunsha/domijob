"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

export function Steps({ value = 1, className, ...props }: StepsProps) {
  const [stepsCount, setStepsCount] = React.useState(0)

  return (
    <div
      className={cn("space-y-8", className)}
      {...props}
      data-value={value}
      data-orientation="vertical"
    >
      {React.Children.map(props.children, (child, index) => {
        if (React.isValidElement(child)) {
          setStepsCount((prev) => Math.max(prev, index + 1))

          return React.cloneElement(child as React.ReactElement<StepProps>, {
            index: index + 1,
            currentStep: value,
            stepsCount: stepsCount,
          })
        }
        return child
      })}
    </div>
  )
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number
  currentStep?: number
  stepsCount?: number
  title: string
  value: number
}

export function Step({
  index,
  currentStep = 1,
  stepsCount = 1,
  title,
  value,
  className,
  children,
  ...props
}: StepProps) {
  const isActive = value === currentStep
  const isCompleted = value < currentStep
  
  return (
    <div
      className={cn(
        "relative",
        isActive ? "opacity-100" : "opacity-80"
      )}
      {...props}
    >
      <div className="flex items-center">
        <div
          className={cn(
            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
            isCompleted
              ? "border-transparent bg-primary text-primary-foreground"
              : isActive
              ? "border-primary bg-background text-foreground"
              : "border-border bg-background text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <span>{value}</span>
          )}
        </div>

        <div
          className={cn(
            "ml-3 font-medium",
            isCompleted ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {title}
        </div>
      </div>

      {value < stepsCount && (
        <div
          className={cn(
            "absolute left-4 top-4 h-[calc(100%-16px)] w-px -translate-x-1/2",
            isCompleted ? "bg-primary" : "bg-border"
          )}
        />
      )}

      <div className={cn(value === currentStep ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  )
} 