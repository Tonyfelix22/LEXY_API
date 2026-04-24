"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { LogOut, UserCircle2, Bell, Settings, Zap } from "lucide-react"

import { NotificationBell } from "@/components/notifications/NotificationBell"

export default function Navbar() {
    const { user, logout, isLoading, isSuperAdmin } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        toast.success("Logged out successfully")
        router.push("/")
    }

    if (isLoading) {
        return (
            <nav className="bg-card/80 backdrop-blur-xl border-b border-border shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            </nav>
        )
    }

    return (
        <nav className="bg-card/80 backdrop-blur-xl border-b border-border shadow-sm sticky top-0 z-40">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* Logo / Brand */}
                <div
                    className="flex items-center gap-3 cursor-pointer select-none group"
                    onClick={() => router.push("/dashboard")}
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all-smooth group-hover:scale-105">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        <span className="text-gradient">LEXIE</span> <span className="text-foreground/80">ERP</span>
                    </h1>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <NotificationBell />
                            
                            <button
                                onClick={() => router.push("/dashboard/settings")}
                                className="p-2.5 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-all-smooth hover:shadow-lg group"
                                title="Settings"
                            >
                                <Settings className="h-5 w-5 text-foreground/60 group-hover:text-primary transition-colors" />
                            </button>

                            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/50 transition-all-smooth">
                                        <UserCircle2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="hidden md:flex flex-col">
                                        <span className="font-medium text-sm text-foreground">{user.username}</span>
                                        <span className="text-xs text-foreground/50">
                                            {user.role?.toUpperCase() || user.groups?.join(", ") || "User"}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-destructive/90 hover:bg-destructive text-white rounded-xl transition-all-smooth text-sm font-medium shadow-lg shadow-destructive/20 hover:shadow-destructive/40 hover-lift ml-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden lg:inline">Logout</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all-smooth text-sm font-medium shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}
