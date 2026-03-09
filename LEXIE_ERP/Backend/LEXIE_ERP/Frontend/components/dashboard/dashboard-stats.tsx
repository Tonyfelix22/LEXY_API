"use client";

import { Users, DollarSign, CreditCard, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
    data: {
        total_employees: number;
        total_payroll_cost: number;
        current_budget: number;
        revenue: number;
    } | null;
    isLoading: boolean;
}

export function DashboardStats({ data, isLoading }: DashboardStatsProps) {
    if (isLoading || !data) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    const stats = [
        {
            title: "Total Employees",
            value: data.total_employees,
            icon: Users,
            description: "Active employees",
        },
        {
            title: "Total Payroll Cost",
            value: new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(data.total_payroll_cost),
            icon: DollarSign,
            description: "Last month",
        },
        {
            title: "Current Budget",
            value: new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(data.current_budget),
            icon: CreditCard,
            description: "Active budget",
        },
        {
            title: "Revenue",
            value: new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(data.revenue),
            icon: TrendingUp,
            description: "Year to date",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
                >
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </h3>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="content">
                        <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                        </div>
                        {/* <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p> */}
                    </div>
                </div>
            ))}
        </div>
    );
}
