"use client"

import { ReactNode, Suspense } from "react"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "react-hot-toast"

export default function ClientLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            {/* Suspense ensures smooth hydration for async user loading */}
            <Suspense
                fallback={
                    <div className="flex items-center justify-center min-h-screen bg-background">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                }
            >
                <main className="min-h-screen bg-gray-50 text-foreground">{children}</main>
            </Suspense>

            {/* Global toaster notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#fff",
                        color: "#333",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981", // emerald green
                            secondary: "#fff",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#ef4444", // red
                            secondary: "#fff",
                        },
                    },
                }}
            />
        </AuthProvider>
    )
}
