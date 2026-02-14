"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { LogOut, UserCircle2 } from "lucide-react"

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
            <nav className="bg-slate-900 border-b border-slate-800 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
                <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
            </nav>
        )
    }

    return (
        <nav className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-40">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* Logo / Brand */}
                <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => router.push("/dashboard")}
                >
                    <h1 className="text-xl font-bold tracking-tight">
                        <span className="text-sky-400">LEXIE</span> <span className="text-white">ERP</span>
                    </h1>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-6">
                    {/* View As Dropdown Removed */}
                    {user ? (
                        <>
                            <NotificationBell />
                            <div className="flex items-center gap-2 text-sm text-white">
                                <UserCircle2 className="h-5 w-5 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.username}</span>
                                    <span className="text-xs text-slate-400">
                                        {user.role?.toUpperCase() || user.groups?.join(", ") || "User"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-lg shadow-red-900/20"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition text-sm font-medium shadow-lg shadow-sky-500/20"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}
