"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    // 🔹 Fix: Prevent SSR/client mismatch
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    if (!isMounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const user = await login(username, password);

            if (!user || user.has_profile === false) {
                toast.error("Your profile is missing. Contact admin.");
                return;
            }

            // ✅ Dynamic redirects by role AND department
            const role = user.role?.toUpperCase() || "";
            const department = user.department || "";

            const isHR = role === "HR" || user.groups?.some(g => g.toLowerCase() === "hr") || department.includes("Human Resources");
            const isFinance = role === "FINANCE" || user.groups?.some(g => g.toLowerCase() === "finance") || department.includes("Finance");
            const isAudit = role === "AUDIT" || user.groups?.some(g => g.toLowerCase() === "audit") || department.includes("Audit");

            if (isHR) {
                router.push("/dashboard/hr");
            } else if (isFinance) {
                router.push("/dashboard/finance");
            } else if (isAudit) {
                router.push("/dashboard"); // Or audit dashboard if it exists
            } else {
                router.push("/dashboard");
            }

            toast.success(`Welcome back, ${user.username}!`);
        } catch (error: any) {
            console.error("Login error:", error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Login failed. Check your credentials.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="w-full max-w-md bg-slate-900 rounded-lg shadow-xl p-8 border border-sky-400/30">
                <h1 className="text-3xl font-bold text-center mb-2 text-white">LEXIE ERP</h1>
                <p className="text-center text-gray-400 mb-8">Sign in to your account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <a href="/forgot-password" className="text-sm text-sky-400 hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>

                    <p className="text-center text-sm text-gray-400 mt-4">
                        Don’t have an account?{" "}
                        <a href="/register" className="text-sky-400 font-bold hover:underline">
                            Register
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
