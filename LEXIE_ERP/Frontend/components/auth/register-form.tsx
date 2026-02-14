"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { getAuthToken } from "@/utils/token";

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
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="w-full max-w-md bg-slate-900 border border-sky-400/30 rounded-lg shadow-xl p-8">
                <h1 className="text-3xl font-bold text-center mb-2 text-white">
                    {isSuperAdmin ? "Create Admin Account" : (isHRAdmin ? "Create Employee Account" : "Create Account")}
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    {isSuperAdmin ? "Register a new Department Admin" : (isHRAdmin ? "Register a new Employee" : "Join LEXIE ERP Platform")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-200">
                            Username
                        </label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-200">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-200">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-200">
                            Confirm Password
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    {/* Role - Only visible to Super Admin */}
                    {isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-200">
                                Role
                            </label>
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
                                className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                                required
                            >
                                <option value="" disabled>Select a role</option>
                                <option value="hr">HR Admin</option>
                                <option value="finance">Finance Admin</option>
                                <option value="audit">Audit Admin</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Department will be auto-assigned based on your role
                            </p>
                        </div>
                    )}

                    {/* Department Selection - Visible for HR Admin creating Employees */}
                    {isHRAdmin && !isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-200">
                                Department
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                                required
                            >
                                <option value="" disabled>Select Department</option>
                                <option value="Human Resources">Human Resources</option>
                                <option value="Finance">Finance</option>
                                <option value="Audit">Audit</option>
                            </select>
                        </div>
                    )}

                    {/* Department (Auto-assigned) - Only visible if role selected by Super Admin */}
                    {isSuperAdmin && formData.role && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-200">
                                Department
                            </label>
                            <input
                                name="department"
                                type="text"
                                value={formData.department}
                                readOnly
                                className="w-full px-4 py-2 border border-sky-400/20 rounded-lg bg-slate-800/50 text-gray-400 cursor-not-allowed"
                                placeholder="Auto-assigned based on role"
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-sky-500 text-white rounded-lg py-2 font-medium hover:bg-sky-600 transition disabled:opacity-50"
                    >
                        {isLoading ? "Registering..." : (isSuperAdmin ? "Create User" : "Register")}
                    </button>

                    {!user && (
                        <p className="text-center text-sm text-gray-400 mt-4">
                            Already have an account?{" "}
                            <a href="/login" className="text-sky-400 hover:underline">
                                Login
                            </a>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}