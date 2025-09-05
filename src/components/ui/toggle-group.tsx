"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ToggleGroupContext = React.createContext<{
  type: "single" | "multiple"
  value: string | string[]
  onValueChange: (value: string | string[]) => void
}>({
  type: "single",
  value: "",
  onValueChange: () => {},
})

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    value?: string | string[]
    onValueChange?: (value: string | string[]) => void
  }
>(({ className, type = "single", value, onValueChange, ...props }, ref) => {
  return (
    <ToggleGroupContext.Provider value={{ type, value: value || (type === "single" ? "" : []), onValueChange: onValueChange || (() => {}) }}>
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      />
    </ToggleGroupContext.Provider>
  )
})
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  
  const isSelected = context.type === "single" 
    ? context.value === value
    : Array.isArray(context.value) && context.value.includes(value)

  const handleClick = () => {
    if (context.type === "single") {
      context.onValueChange(value)
    } else {
      const currentValue = Array.isArray(context.value) ? context.value : []
      const newValue = currentValue.includes(value)
        ? currentValue.filter(v => v !== value)
        : [...currentValue, value]
      context.onValueChange(newValue)
    }
  }

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
