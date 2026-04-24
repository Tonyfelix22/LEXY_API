"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { 
    Users, 
    Wallet, 
    Shield, 
    BarChart3, 
    DollarSign, 
    UserPlus,
    TrendingUp,
    ArrowRight,
    Zap
} from "lucide-react";

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
            setStats(prev => ({
                ...prev,
                welcomeMessage: `Welcome, ${user.username}! You are logged in as ${roleName}`,
            }));
        }
    }, [user, isLoading, router, isSuperAdmin, isHRAdmin, isFinanceAdmin, isAuditAdmin]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
                    <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
                </div>
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
        AUDITOR: "Auditor",
    };

    const displayRole = isSuperAdmin ? "Super Admin" : (roleNames[role] || role);

    return (
        <div className="space-y-8 bg-background min-h-screen p-6 animate-fadeIn">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl glass-card p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
                            <p className="text-foreground/60 mt-1">{stats.welcomeMessage}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role-based quick access */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* HR Access */}
                {(isHRAdmin || role === "HR") && (
                    <div
                        onClick={() => router.push("/dashboard/hr")}
                        className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                                <Users className="w-7 h-7 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Human Resources</h3>
                        <p className="text-sm text-foreground/60">
                            Manage employees, departments, and payroll
                        </p>
                    </div>
                )}

                {/* Finance Access */}
                {(isFinanceAdmin || role === "FINANCE") && (
                    <div
                        onClick={() => router.push("/dashboard/finance")}
                        className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                                <Wallet className="w-7 h-7 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Finance</h3>
                        <p className="text-sm text-foreground/60">
                            Manage accounts, journal entries, and financial records
                        </p>
                    </div>
                )}

                {/* Audit Logs - Available to Audit Admins */}
                {(isAuditAdmin || role === "AUDIT" || role === "AUDITOR") && (
                    <div
                        onClick={() => router.push("/dashboard/audit")}
                        className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                                <Shield className="w-7 h-7 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Audit Logs</h3>
                        <p className="text-sm text-foreground/60">
                            View system activity and audit trails
                        </p>
                    </div>
                )}

                {/* Reports Center - Available to all authenticated users */}
                <div
                    onClick={() => router.push("/dashboard/reports")}
                    className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                            <BarChart3 className="w-7 h-7 text-primary" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Reports Center</h3>
                    <p className="text-sm text-foreground/60">
                        Generate and export financial and HR reports
                    </p>
                </div>

                {/* Payroll - Available to HR and Finance */}
                {(isHRAdmin || isFinanceAdmin || role === "HR" || role === "FINANCE") && (
                    <div
                        onClick={() => router.push("/dashboard/hr/payroll_runs")}
                        className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                                <DollarSign className="w-7 h-7 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Payroll</h3>
                        <p className="text-sm text-foreground/60">
                            View and manage payroll runs
                        </p>
                    </div>
                )}

                {/* Super Admin - Create Admin Accounts */}
                {isSuperAdmin && (
                    <div
                        onClick={() => router.push("/register")}
                        className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group border-border/50 hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-all-smooth">
                                <UserPlus className="w-7 h-7 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all-smooth" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Create Admin Account</h3>
                        <p className="text-sm text-foreground/60">
                            Register new HR, Finance, or Audit Admins
                        </p>
                    </div>
                )}
            </div>

            {/* User Info Card */}
            <div className="glass-card rounded-2xl p-6 border-border/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Your Profile</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="text-sm text-foreground/60 mb-1">Username</div>
                        <div className="font-semibold text-foreground">{user.username}</div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="text-sm text-foreground/60 mb-1">Email</div>
                        <div className="font-semibold text-foreground">{user.email}</div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="text-sm text-foreground/60 mb-1">Role</div>
                        <div className="font-semibold text-primary">{displayRole}</div>
                    </div>
                    
                    {user.department && (
                        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                            <div className="text-sm text-foreground/60 mb-1">Department</div>
                            <div className="font-semibold text-foreground">{user.department}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
