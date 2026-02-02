"use client"

import { useMemo } from "react"
import { Users, Briefcase, UserCheck } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatDistanceToNow } from "date-fns"
import HiringTrendChart from "@/components/dashboard/hr/hiring-trend-chart"

interface Employee {
    id: number
    full_name: string
    department_name?: string
    status: string
    hire_date: string
    job_title: string
}

interface Department {
    id: number
    name: string
}

interface ModernHRDashboardProps {
    employees: Employee[]
    departments: Department[]
    history: any[]
}

export default function ModernHRDashboard({ employees, departments, history }: ModernHRDashboardProps) {
    const stats = useMemo(() => {
        const totalEmployees = employees.length
        const totalDepartments = departments.length
        const activeEmployees = employees.filter(
            (e) => e.status?.toUpperCase() === "ACTIVE"
        ).length

        return { totalEmployees, totalDepartments, activeEmployees }
    }, [employees, departments])

    const chartData = useMemo(() => {
        const data: Record<string, number> = {}
        employees.forEach((emp) => {
            const dept = emp.department_name || "Unknown"
            data[dept] = (data[dept] || 0) + 1
        })

        return Object.entries(data).map(([name, count]) => ({
            name,
            count,
        })).sort((a, b) => b.count - a.count).slice(0, 6) // Top 6 departments
    }, [employees])

    const recentOnboardings = useMemo(() => {
        return [...employees]
            .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
            .slice(0, 4)
    }, [employees])

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Departments</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Trend Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Employment History</h3>
                    <div className="h-[300px] w-full">
                        <HiringTrendChart history={history} />
                    </div>
                </div>

                {/* Employees by Department Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Employees by Department</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 2 ? '#1D4ED8' : '#BFDBFE'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Onboardings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Onboardings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentOnboardings.map((emp) => (
                        <div key={emp.id} className="flex items-center gap-4 p-4 border border-gray-50 rounded-lg hover:bg-gray-50 transition">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                {emp.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{emp.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{emp.job_title}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(emp.hire_date), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
