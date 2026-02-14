"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/context/auth-context"
import { LayoutGrid, List, Users, CheckCircle, Calendar, ArrowRight, CreditCard, Briefcase } from "lucide-react"
import { apiFetch } from "@/utils/api"

const ModernHRDashboard = dynamic(
    () => import("@/components/dashboard/hr/modern-dashboard"),
    { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-slate-800" /> }
)

interface DashboardStats {
    totalEmployees: number
    totalDepartments: number
    activeEmployees: number
}

export default function HRDashboard() {
    const { user, token, isHRAdmin } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        totalDepartments: 0,
        activeEmployees: 0,
    })
    const [employees, setEmployees] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'classic' | 'modern'>('modern')

    useEffect(() => {
        if (token && isHRAdmin) {
            fetchDashboardStats()
        } else {
            setLoading(false)
            if (!isHRAdmin) setError("Access denied: HR only")
        }
    }, [token])

    const fetchDashboardStats = async () => {
        setLoading(true)
        setError(null)

        try {
            const [employeesData, departmentsData, historyData] = await Promise.all([
                apiFetch("/hr/employees/"),
                apiFetch("/hr/departments/"),
                apiFetch("/hr/employment-history/"),
            ])

            const employeesList = Array.isArray(employeesData)
                ? employeesData
                : employeesData.results || []

            const departmentsList = Array.isArray(departmentsData)
                ? departmentsData
                : departmentsData.results || []

            const historyList = Array.isArray(historyData)
                ? historyData
                : historyData.results || []

            setEmployees(employeesList)
            setDepartments(departmentsList)
            setHistory(historyList)

            const totalEmployees = employeesList.length
            const activeEmployees = employeesList.filter(
                (emp: any) => emp.status?.toUpperCase() === "ACTIVE"
            ).length
            const totalDepartments = departmentsList.length

            setStats({ totalEmployees, totalDepartments, activeEmployees })
        } catch (err: any) {
            console.error("❌ Error fetching dashboard:", err)
            setError(err.message || "Error loading HR dashboard.")
        } finally {
            setLoading(false)
        }
    }

    const formatNumber = (num: number) =>
        new Intl.NumberFormat("en-US").format(num)

    const getActivePercentage = () => {
        if (stats.totalEmployees === 0) return 0
        return Math.round((stats.activeEmployees / stats.totalEmployees) * 100)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                <p className="font-semibold">{error}</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#1e3a8a] tracking-tight">HR Dashboard</h1>
                    {user && <p className="text-[#0ea5e9] font-medium mt-1">Welcome back, {user.username}</p>}
                </div>

                <div className="flex items-center bg-white p-1 rounded-xl border-2 border-[#0ea5e9]/20 shadow-sm">
                    <button
                        onClick={() => setViewMode('classic')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'classic' ? 'bg-[#1e3a8a] shadow-md text-white' : 'text-slate-400 hover:text-[#1e3a8a]'}`}
                        title="Classic View"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('modern')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'modern' ? 'bg-[#1e3a8a] shadow-md text-white' : 'text-slate-400 hover:text-[#1e3a8a]'}`}
                        title="Modern View"
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'modern' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ModernHRDashboard employees={employees} departments={departments} history={history} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatCard
                        title="Total Employees"
                        value={formatNumber(stats.totalEmployees)}
                        subtitle="Across all departments"
                        color="text-[#1e3a8a]"
                        icon={<Users className="w-6 h-6 text-[#0ea5e9]" />}
                    />

                    <StatCard
                        title="Departments"
                        value={formatNumber(stats.totalDepartments)}
                        subtitle="Organizational units"
                        color="text-[#1e3a8a]"
                        icon={<LayoutGrid className="w-6 h-6 text-[#0ea5e9]" />}
                    />

                    <StatCard
                        title="Active Employees"
                        value={formatNumber(stats.activeEmployees)}
                        subtitle={`${getActivePercentage()}% of total workforce`}
                        color="text-[#0ea5e9]"
                        icon={<CheckCircle className="w-6 h-6 text-green-500" />}
                    />

                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#0ea5e9]/20 hover:shadow-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-all duration-300 cursor-pointer group relative overflow-hidden" onClick={() => window.location.href = '/dashboard/leave'}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar className="w-20 h-20 text-[#1e3a8a]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1e3a8a] mb-2 group-hover:text-[#0ea5e9] transition-colors">Leave Management</h3>
                        <p className="text-sm text-slate-500 mt-2">Manage employee leave requests, balances and policies</p>
                        <div className="mt-6 flex items-center text-[#0ea5e9] font-bold group-hover:translate-x-1 transition-transform">
                            <span>Go to Leave Dashboard</span>
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-8 rounded-2xl shadow-xl border border-[#1e3a8a] hover:shadow-[#1e3a8a]/40 transition-all duration-300 cursor-pointer group relative overflow-hidden" onClick={() => window.location.href = '/dashboard/hr/payroll_runs'}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard className="w-20 h-20 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 transition-colors">Payroll Management</h3>
                        <p className="text-sm text-blue-100 mt-2 opacity-80">Process payroll runs, manage deductions and generate payslips</p>
                        <div className="mt-6 flex items-center text-[#0ea5e9] font-bold group-hover:translate-x-1 transition-transform">
                            <span className="text-white">Go to Payroll</span>
                            <ArrowRight className="ml-2 w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#0ea5e9]/20 hover:shadow-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-all duration-300 cursor-pointer group relative overflow-hidden" onClick={() => window.location.href = '/dashboard/hr/recruitment'}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase className="w-20 h-20 text-[#1e3a8a]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1e3a8a] mb-2 group-hover:text-[#0ea5e9] transition-colors">Recruitment</h3>
                        <p className="text-sm text-slate-500 mt-2">Manage job postings, track applicants and handle hiring</p>
                        <div className="mt-6 flex items-center text-[#0ea5e9] font-bold group-hover:translate-x-1 transition-transform">
                            <span>Manage Recruitment</span>
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface StatCardProps {
    title: string
    value: string
    subtitle: string
    color?: string
    icon?: React.ReactNode
    bgColor?: string
}

function StatCard({ title, value, subtitle, color = "text-[#1e3a8a]", icon, bgColor = "bg-white" }: StatCardProps) {
    return (
        <div className={`${bgColor} p-8 rounded-2xl shadow-lg border border-[#0ea5e9]/20 hover:shadow-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-all duration-300 group relative overflow-hidden`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-500 mb-2 group-hover:text-[#1e3a8a] transition-colors">{title}</h3>
                    <p className={`text-4xl font-extrabold ${color}`}>{value}</p>
                </div>
                {icon && <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">{icon}</div>}
            </div>
            <p className="text-sm text-slate-400 mt-4 font-medium italic">{subtitle}</p>
        </div>
    )
}
