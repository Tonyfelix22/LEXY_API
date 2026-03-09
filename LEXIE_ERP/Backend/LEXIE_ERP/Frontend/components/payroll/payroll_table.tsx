"use client"

import { useAuth } from "@/context/auth-context"

interface PayrollRun {
    id: number
    employee: number
    employee_staff_number?: string
    employee_name?: string
    period_start: string
    period_end: string
    basic_salary: number
    allowances: number
    overtime: number
    gross_salary: number
    paye_tax: number
    nssf_deduction: number
    SHA_deduction: number
    other_deductions: number
    total_deductions: number
    net_salary: number
    status: string
}

interface PayrollTableProps {
    payrolls: PayrollRun[]
    onEdit: (payroll: PayrollRun) => void
    onDelete: (id: number) => void
    onCalculate?: (payroll: PayrollRun) => void
    onApprove?: (payroll: PayrollRun) => void
}

export default function PayrollTable({ payrolls, onEdit, onDelete, onCalculate, onApprove }: PayrollTableProps) {
    const { user } = useAuth()

    const role = user?.groups?.[0] || "User"
    const isHR = role.toLowerCase().includes("hr")
    const isFinance = role.toLowerCase().includes("finance")
    const isAdmin = role.toLowerCase().includes("admin")

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === "string" ? parseFloat(amount) : amount
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0,
        }).format(num)
    }

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case "DRAFT":
                return "bg-muted text-muted-foreground"
            case "CALCULATED":
                return "bg-primary/10 text-primary"
            case "APPROVED":
                return "bg-green-500/10 text-green-500"
            case "POSTED":
                return "bg-purple-500/10 text-purple-500"
            case "PAID":
                return "bg-emerald-500/10 text-emerald-500"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const canEdit = (status: string) => {
        if (isAdmin) return true
        if (isHR && status === "DRAFT") return true
        if (isFinance && ["CALCULATED", "APPROVED"].includes(status.toUpperCase())) return true
        return false
    }

    const canDelete = (status: string) => {
        if (isAdmin) return true
        if (isHR && status === "DRAFT") return true
        return false
    }

    if (payrolls.length === 0) {
        return (
            <div className="bg-card rounded-lg shadow border border-border overflow-hidden text-center py-8 text-muted-foreground">
                No payroll runs found
            </div>
        )
    }

    return (
        <div className="bg-card rounded-lg shadow border border-border overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/20 border-b border-border">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Staff Number</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Employee</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Period</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Gross</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Deductions</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Net</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {payrolls.map((p) => (
                        <tr key={p.id} className="hover:bg-primary/10 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{p.employee_staff_number}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{p.employee_name || p.employee}</td>
                            <td className="px-6 py-4 text-sm text-foreground">
                                {new Date(p.period_start).toLocaleDateString()} -{" "}
                                {new Date(p.period_end).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                {formatCurrency(p.gross_salary)}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                                {formatCurrency(p.total_deductions)}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-foreground">
                                {formatCurrency(p.net_salary)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                        p.status
                                    )}`}
                                >
                                    {p.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm space-x-2">
                                {p.status === "DRAFT" && (
                                    <button
                                        onClick={() => onCalculate && onCalculate(p)}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Calculate
                                    </button>
                                )}
                                {isFinance && p.status === "CALCULATED" && (
                                    <button
                                        onClick={() => onApprove && onApprove(p)}
                                        className="text-green-600 hover:underline font-medium"
                                    >
                                        Approve
                                    </button>
                                )}
                                {canEdit(p.status) && (
                                    <button
                                        onClick={() => onEdit(p)}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                                {canDelete(p.status) && (
                                    <button
                                        onClick={() => onDelete(p.id)}
                                        className="text-error hover:underline font-medium"
                                    >
                                        Delete
                                    </button>
                                )}
                                {!canEdit(p.status) && !canDelete(p.status) && p.status !== "DRAFT" && p.status !== "CALCULATED" && (
                                    <span className="text-muted text-xs italic">View Only</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
