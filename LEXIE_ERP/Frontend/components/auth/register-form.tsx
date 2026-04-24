"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { getAuthToken } from "@/utils/token";
import { Lock, User, Mail, ArrowRight, UserPlus, Shield } from "lucide-react";

export default function RegisterForm() {
    const router = useRouter();
    const { loginWithToken, user, isSuperAdmin, isHRAdmin } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        department: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_BASE_API || "http://127.0.0.1:8000/api";

            // Determine role: If Super Admin, use selected role. Else default to 'employee'.
            const roleToSend = isSuperAdmin && formData.role ? formData.role : "employee";

            // 🔹 Step 1: Register user
            // Include auth token if logged in (to prove Admin status)
            const headers: any = { "Content-Type": "application/json" };
            const token = getAuthToken(); // Use utility to get correct token key
            if (token) {
                headers["Authorization"] = `Token ${token}`;
            }

            const res = await fetch(`${apiUrl}/users/register/`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    // Normalize role values to backend expected enums
                    role: roleToSend.toLowerCase(),
                    department: formData.department || null, // Send null if empty
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("❌ Registration failed:", data);
                // Handle specific error messages
                const errorMessage = data.username
                    ? "Username already exists"
                    : data.email
                        ? "Email already exists"
                        : data.message || data.error || "Registration failed.";
                throw new Error(errorMessage);
            }

            // 🔹 Step 2: Handle Success
            console.log("✅ Registration successful");

            if (user) {
                // If already logged in (e.g. Admin creating user), don't switch users
                toast.success(`User ${formData.username} created successfully!`);
                // Reset form
                setFormData({
                    username: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    role: "",
                    department: "",
                });
            } else {
                // Public registration -> Auto login
                if (!data.token) {
                    throw new Error("No token returned from backend.");
                }
                const newUser = await loginWithToken(data.token);
                toast.success(`Welcome, ${newUser.username}!`);
                router.push("/dashboard");
            }

        } catch (err: any) {
            console.error("❌ Registration error:", err);
            toast.error(err.message || "Something went wrong during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 gradient-mesh animate-gradient opacity-40"></div>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-fadeIn">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 mb-4 animate-pulse-glow">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">
                        {isSuperAdmin ? "Create Admin" : (isHRAdmin ? "Create Employee" : "Join LEXIE")}
                    </h1>
                    <p className="text-foreground/60">
                        {isSuperAdmin ? "Register a new Department Admin" : (isHRAdmin ? "Register a new Employee" : "Create your account")}
                    </p>
                </div>

                {/* Glass Card Form */}
                <div className="glass-card rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role - Only visible to Super Admin */}
                        {isSuperAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-2">
                                    Role
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Shield className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={(e) => {
                                            const role = e.target.value;
                                            let department = "";
                                            if (role === "hr") department = "Human Resources";
                                            if (role === "finance") department = "Finance";
                                            if (role === "audit") department = "Audit";

                                            setFormData((prev) => ({ ...prev, role, department }));
                                        }}
                                        className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select a role</option>
                                        <option value="hr">HR Admin</option>
                                        <option value="finance">Finance Admin</option>
                                        <option value="audit">Audit Admin</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-foreground/40">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs text-foreground/50 mt-2">
                                    Department will be auto-assigned based on your role
                                </p>
                            </div>
                        )}

                        {/* Department Selection - Visible for HR Admin creating Employees */}
                        {isHRAdmin && !isSuperAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-2">
                                    Department
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Shield className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        <option value="Human Resources">Human Resources</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Audit">Audit</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-foreground/40">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Department (Auto-assigned) - Only visible if role selected by Super Admin */}
                        {isSuperAdmin && formData.role && (
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-2">
                                    Department
                                </label>
                                <input
                                    name="department"
                                    type="text"
                                    value={formData.department}
                                    readOnly
                                    className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card/30 text-foreground/50 cursor-not-allowed"
                                    placeholder="Auto-assigned based on role"
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all-smooth disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                                    <span>Registering...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSuperAdmin ? "Create User" : "Register"}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {!user && (
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/50"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-card text-foreground/60">or</span>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <p className="text-center text-sm text-foreground/60">
                                Already have an account?{" "}
                                <a href="/login" className="text-primary font-bold hover:text-primary/80 hover:underline transition-all-smooth">
                                    Login here
                                </a>
                            </p>
                        )}
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