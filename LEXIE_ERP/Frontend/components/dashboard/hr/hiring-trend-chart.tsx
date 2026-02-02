"use client"

import { useMemo } from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from "date-fns"

interface HiringTrendChartProps {
    history: any[]
}

export default function HiringTrendChart({ history }: HiringTrendChartProps) {
    const data = useMemo(() => {
        // Generate last 12 months
        const months = Array.from({ length: 12 }, (_, i) => {
            return startOfMonth(subMonths(new Date(), 11 - i))
        })

        return months.map((month) => {
            const count = history.filter((record) => {
                if (!record.effective_date) return false
                const recordDate = parseISO(record.effective_date)
                return isSameMonth(recordDate, month)
            }).length

            return {
                name: format(month, "MMM"),
                count: count,
            }
        })
    }, [history])

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
