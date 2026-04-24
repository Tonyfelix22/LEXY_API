"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import { Lock, User, Zap, ArrowRight } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 gradient-mesh animate-gradient opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-fadeIn">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 mb-4 animate-pulse-glow">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">LEXIE ERP</h1>
                    <p className="text-foreground/60">Sign in to your account</p>
                </div>

                {/* Glass Card Form */}
                <div className="glass-card rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-3">
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-3">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="/forgot-password" className="text-sm text-primary hover:text-primary/80 hover:underline transition-all-smooth font-medium">
                                Forgot Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all-smooth disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/50"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-card text-foreground/60">or</span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-foreground/60">
                            Don't have an account?{" "}
                            <a href="/register" className="text-primary font-bold hover:text-primary/80 hover:underline transition-all-smooth">
                                Register here
                            </a>
                        </p>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-foreground/40">
                        © {new Date().getFullYear()} LEXIE ERP. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
