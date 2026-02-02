"use client";

import { useState } from "react";
import { apiFetch as api } from "@/utils/api";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api("/users/reset_password/", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setIsSubmitted(true);
            toast.success("Password reset link sent to your email.");
        } catch (error: any) {
            console.error("Forgot password error:", error);
            toast.error(error.message || "Failed to send reset link.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-md bg-black rounded-lg shadow-lg p-8 border border-[#FF2400]">
                <h1 className="text-3xl font-bold text-center mb-2 text-[#FF2400]">LEXIE ERP</h1>
                <p className="text-center text-[#FF2400] mb-8">Reset your password</p>

                {isSubmitted ? (
                    <div className="text-center">
                        <p className="text-[#FF2400] mb-6">
                            If an account exists with that email, we have sent a password reset link.
                            Please check your email.
                        </p>
                        <Link
                            href="/login"
                            className="text-[#FF2400] font-bold hover:underline"
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#FF2400] mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-[#FF2400] rounded-lg text-[#FF2400] placeholder-[#FF2400]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2400]"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#FF2400] hover:bg-[#cc1d00] text-black font-bold py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </button>

                        <div className="text-center mt-4">
                            <Link
                                href="/login"
                                className="text-sm text-[#FF2400] hover:underline"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
