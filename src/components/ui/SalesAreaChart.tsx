"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { useCurrency } from "@/hooks/useCurrency"

interface SalesData {
  date: string
  sales: number
}

interface SalesAreaChartProps {
  data: SalesData[]
  period: string
}

export function SalesAreaChart({ data, period }: SalesAreaChartProps) {
  // Currency formatter
  const { format: formatCurrency } = useCurrency();
  
  // Transform data for the chart
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    sales: item.sales
  }))

  // Only show real data, no fallback
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">No sales data available</p>
          <p className="text-sm">Sales data will appear here once orders are completed</p>
        </div>
      </div>
    )
  }

  const maxSales = Math.max(...chartData.map(d => d.sales))
  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0)
  const avgSales = totalSales / chartData.length

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#10b981"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="#10b981"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(payload[0].value || 0)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#fillSales)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Chart Footer */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-gray-600">
            Average: {formatCurrency(avgSales)} per {period}
          </span>
        </div>
        <div className="text-gray-500">
          Total: {formatCurrency(totalSales)}
        </div>
      </div>
    </div>
  )
}
