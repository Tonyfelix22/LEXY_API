"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

export default function Sidebar() {
    const pathname = usePathname()
    const { user, isLoading, isHRAdmin, isFinanceAdmin, isAuditAdmin, isSuperAdmin } = useAuth()

    if (isLoading) {
        return (
            <aside className="w-64 bg-white border-r border-border shadow-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </aside>
        )
    }

    // Extract role from user context
    const role = (user?.role || "GUEST").toUpperCase()

    const roleNames: Record<string, string> = {
        HR: "Human Resources",
        FINANCE: "Finance",
        ADMIN: "Administrator",
        MANAGER: "Manager",
        STAFF: "Staff",
        AUDIT: "Audit Admin",
        AUDITOR: "Auditor",
    };

    const displayRole = isSuperAdmin ? "Super Admin" : (roleNames[role] || role);

    const isActive = (path: string) => pathname.startsWith(path)

    // ===============================
    // Centralized Role-Based Menus
    // ===============================
    const navConfig: Record<string, { label: string; href: string }[]> = {
        COMMON: [
            { label: "Dashboard Home", href: "/dashboard" },
            { label: "My Leave", href: "/dashboard/leave" },
            { label: "My Travels", href: "/dashboard/travel" },
            { label: "My Purchase Requests", href: "/dashboard/procurement" },
            { label: "Internal Jobs", href: "/dashboard/jobs" },
        ],

        HR: [
            { label: "HR Dashboard", href: "/dashboard/hr" },
            { label: "Employees", href: "/dashboard/hr/employees" },
            { label: "Departments", href: "/dashboard/hr/departments" },
            { label: "Recruitment", href: "/dashboard/hr/recruitment" },
            { label: "Performance", href: "/dashboard/hr/performance" },
            { label: "Employment History", href: "/dashboard/hr/employee_history" },
            { label: "Payroll Runs", href: "/dashboard/hr/payroll_runs" },
        ],

        FINANCE: [
            { label: "Finance Dashboard", href: "/dashboard/finance" },
            { label: "Budgets & Approvals", href: "/dashboard/finance/budgets" },
            { label: "Procurement Admin", href: "/dashboard/finance/procurement" },
            { label: "Accounts", href: "/dashboard/finance/accounts" },
            { label: "Journal Entries", href: "/dashboard/finance/journal-entries" },
            { label: "Payroll Approval", href: "/dashboard/finance/payroll-approval" },
            { label: "Bank Reconciliation", href: "/dashboard/finance/bank-reconciliation" },
        ],

        AUDIT: [
            { label: "Audit & Compliance", href: "/dashboard/audit" },
            { label: "Reports Center", href: "/dashboard/audit/reports" },
        ],
    }

    // ===============================
    // Combine menu based on role
    // ===============================
    let navItems = [...navConfig.COMMON]

    if (isHRAdmin) {
        navItems = [...navItems, ...navConfig.HR]
    }
    if (isFinanceAdmin) {
        navItems = [...navItems, ...navConfig.FINANCE]
    }
    if (isAuditAdmin) {
        navItems = [...navItems, ...navConfig.AUDIT]
    }

    return (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border shadow-sm flex flex-col">
            <div className="p-6 border-b border-sidebar-border">
                <h2 className="text-lg font-bold text-sidebar-primary-foreground">{displayRole}</h2>

            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive(item.href)
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
                © {new Date().getFullYear()} ERP System
            </div>
        </aside>
    )
}
