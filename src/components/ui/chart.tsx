"use client"

import * as React from "react"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({ config, children }: ChartContainerProps) {
  return (
    <div className="w-full">
      {children}
      <style jsx global>{`
        :root {
          ${Object.entries(config).map(([key, value]) => `--color-${key}: ${value.color};`).join('\n')}
        }
      `}</style>
    </div>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: any
    color?: string
  }>
  label?: string
}

export function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {entry.dataKey}
            </span>
            <span className="font-bold text-muted-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartTooltipContent({ active, payload, label }: TooltipProps) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {entry.dataKey}
            </span>
            <span className="font-bold text-muted-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
