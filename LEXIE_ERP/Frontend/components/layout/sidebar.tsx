"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { 
    LayoutDashboard, 
    CalendarDays, 
    Plane, 
    ShoppingCart, 
    Briefcase,
    Users,
    Building2,
    UserPlus,
    Trophy,
    History,
    DollarSign,
    Wallet,
    FileText,
    BookOpen,
    Landmark,
    Shield,
    BarChart3,
    Zap
} from "lucide-react"

export default function Sidebar() {
    const pathname = usePathname()
    const { user, isLoading, isHRAdmin, isFinanceAdmin, isAuditAdmin, isSuperAdmin } = useAuth()

    if (isLoading) {
        return (
            <aside className="w-72 bg-sidebar border-r border-sidebar-border shadow-xl flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary"></div>
                </div>
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
    const navConfig: Record<string, { label: string; href: string; icon: any }[]> = {
        COMMON: [
            { label: "Dashboard Home", href: "/dashboard", icon: LayoutDashboard },
            { label: "My Leave", href: "/dashboard/leave", icon: CalendarDays },
            { label: "My Travels", href: "/dashboard/travel", icon: Plane },
            { label: "My Purchase Requests", href: "/dashboard/procurement", icon: ShoppingCart },
            { label: "Internal Jobs", href: "/dashboard/jobs", icon: Briefcase },
        ],

        HR: [
            { label: "HR Dashboard", href: "/dashboard/hr", icon: Users },
            { label: "Employees", href: "/dashboard/hr/employees", icon: UserPlus },
            { label: "Departments", href: "/dashboard/hr/departments", icon: Building2 },
            { label: "Recruitment", href: "/dashboard/hr/recruitment", icon: Users },
            { label: "Performance", href: "/dashboard/hr/performance", icon: Trophy },
            { label: "Employment History", href: "/dashboard/hr/employee_history", icon: History },
            { label: "Payroll Runs", href: "/dashboard/hr/payroll_runs", icon: DollarSign },
        ],

        FINANCE: [
            { label: "Finance Dashboard", href: "/dashboard/finance", icon: Wallet },
            { label: "Budgets & Approvals", href: "/dashboard/finance/budgets", icon: FileText },
            { label: "Procurement Admin", href: "/dashboard/finance/procurement", icon: ShoppingCart },
            { label: "Accounts", href: "/dashboard/finance/accounts", icon: Landmark },
            { label: "Journal Entries", href: "/dashboard/finance/journal-entries", icon: BookOpen },
            { label: "Payroll Approval", href: "/dashboard/finance/payroll-approval", icon: DollarSign },
            { label: "Bank Reconciliation", href: "/dashboard/finance/bank-reconciliation", icon: Landmark },
        ],

        AUDIT: [
            { label: "Audit & Compliance", href: "/dashboard/audit", icon: Shield },
            { label: "Reports Center", href: "/dashboard/audit/reports", icon: BarChart3 },
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
        <aside className="w-72 bg-sidebar border-r border-sidebar-border shadow-xl flex flex-col relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative p-6 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-sidebar-foreground">{displayRole}</h2>
                        <p className="text-xs text-sidebar-foreground/50">LEXIE ERP</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 overflow-y-auto p-4 space-y-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all-smooth group relative",
                                active
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                                active ? "text-sidebar-primary-foreground" : ""
                            )} />
                            <span className="flex-1">{item.label}</span>
                            {active && (
                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground animate-pulse"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="relative p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span>© {new Date().getFullYear()} LEXIE ERP</span>
                </div>
            </div>
        </aside>
    )
}
