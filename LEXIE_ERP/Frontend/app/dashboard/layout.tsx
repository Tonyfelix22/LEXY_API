"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
                return;
            }

            // Allow superuser to bypass role restrictions
            if (!user.role && user.role !== "superuser") {
                router.push("/unauthorized");
                return;
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || (!user.role && user.role !== "superuser")) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar role={user.role} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar user={user} />
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    );
}
