"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface FinancialChartProps {
    data: {
        name: string;
        revenue: number;
        expenses: number;
    }[];
    isLoading: boolean;
}

export function FinancialChart({ data, isLoading }: FinancialChartProps) {
    if (isLoading || !data) {
        return (
            <div className="h-[300px] w-full rounded-xl bg-muted/50 animate-pulse" />
        );
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                    Financial Overview
                </h3>
                <p className="text-sm text-muted-foreground">
                    Monthly Expenses vs. Revenue
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                        KES {new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(data.reduce((acc, item) => acc + item.revenue, 0))}
                    </span>
                    <span className="text-sm font-medium text-green-500">
                        +15%
                    </span>
                    <span className="text-xs text-muted-foreground">
                        vs last 6 months
                    </span>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="colorRevenue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                            opacity={0.4}
                        />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                            itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
