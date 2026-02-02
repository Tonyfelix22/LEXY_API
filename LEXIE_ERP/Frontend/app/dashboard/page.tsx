"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

interface DashboardStats {
    totalUsers: number;
    welcomeMessage: string;
}

export default function Dashboard() {
    const { user, isLoading, isHRAdmin, isFinanceAdmin, isAuditAdmin, isSuperAdmin } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        welcomeMessage: "Welcome to LEXIE ERP",
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            // Set welcome message based on role (don't auto-redirect here, let root page handle it)
            const role = user.role?.toUpperCase() || "";
            const roleNames: Record<string, string> = {
                HR: "Human Resources",
                FINANCE: "Finance",
                ADMIN: "Administrator",
                MANAGER: "Manager",
                STAFF: "Staff",
                AUDIT: "Audit Admin",
                AUDITOR: "Auditor",
            };
            const roleName = isSuperAdmin ? "Super Admin" : (roleNames[role] || "User");
            setStats({
                ...stats,
                welcomeMessage: `Welcome, ${user.username}! You are logged in as ${roleName}`,
            });
        }
    }, [user, isLoading, router, isSuperAdmin]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const role = user.role?.toUpperCase() || "STAFF";

    const roleNames: Record<string, string> = {
        HR: "Human Resources",
        FINANCE: "Finance",
        ADMIN: "Administrator",
        MANAGER: "Manager",
        STAFF: "Staff",
        AUDIT: "Audit Admin",
        AUDITOR: "Auditor", // Handle potential legacy/manual value
    };

    const displayRole = isSuperAdmin ? "Super Admin" : (roleNames[role] || role);

    return (
        <div className="space-y-6 bg-slate-900 min-h-screen p-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-2">{stats.welcomeMessage}</p>
            </div>

            {/* Role-based quick access */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* HR Access */}
                {(isHRAdmin || role === "HR") && (
                    <div
                        onClick={() => router.push("/dashboard/hr")}
                        className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                    >
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Human Resources</h3>
                        <p className="text-sm text-slate-400">
                            Manage employees, departments, and payroll
                        </p>
                    </div>
                )}

                {/* Finance Access */}
                {(isFinanceAdmin || role === "FINANCE") && (
                    <div
                        onClick={() => router.push("/dashboard/finance")}
                        className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                    >
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Finance</h3>
                        <p className="text-sm text-slate-400">
                            Manage accounts, journal entries, and financial records
                        </p>
                    </div>
                )}

                {/* Audit Logs - Available to Audit Admins */}
                {(isAuditAdmin || role === "AUDIT" || role === "AUDITOR") && (
                    <div
                        onClick={() => router.push("/dashboard/audit")}
                        className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                    >
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Audit Logs</h3>
                        <p className="text-sm text-slate-400">
                            View system activity and audit trails
                        </p>
                    </div>
                )}

                {/* Reports Center - Available to all authenticated users */}
                <div
                    onClick={() => router.push("/dashboard/reports")}
                    className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                >
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Reports Center</h3>
                    <p className="text-sm text-slate-400">
                        Generate and export financial and HR reports
                    </p>
                </div>

                {/* Payroll - Available to HR and Finance */}
                {(isHRAdmin || isFinanceAdmin || role === "HR" || role === "FINANCE") && (
                    <div
                        onClick={() => router.push("/dashboard/hr/payroll_runs")}
                        className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                    >
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Payroll</h3>
                        <p className="text-sm text-slate-400">
                            View and manage payroll runs
                        </p>
                    </div>
                )}

                {/* Super Admin - Create Admin Accounts */}
                {isSuperAdmin && (
                    <div
                        onClick={() => router.push("/register")}
                        className="p-6 bg-slate-800 rounded-lg shadow-md hover:shadow-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer border border-slate-700 group"
                    >
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">Create Admin Account</h3>
                        <p className="text-sm text-slate-400">
                            Register new HR, Finance, or Audit Admins
                        </p>
                    </div>
                )}
            </div>

            {/* User Info Card */}
            <div className="p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Your Profile</h2>
                <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">Username:</span>
                        <span className="font-medium text-white">{user.username}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-medium text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">Role:</span>
                        <span className="font-medium text-sky-400">{displayRole}</span>
                    </div>
                    {user.department && (
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-medium text-white">{user.department}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
