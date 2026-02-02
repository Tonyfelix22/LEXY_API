"use client";

import { useState, useEffect } from "react";
import { apiFetch as api } from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const params = useParams();

    // Fix for hydration mismatch
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);

        try {
            await api("/users/reset_password_confirm/", {
                method: "POST",
                body: JSON.stringify({
                    uid: params.uid,
                    token: params.token,
                    new_password: newPassword,
                    re_new_password: confirmPassword,
                }),
            });

            toast.success("Password has been reset successfully.");
            router.push("/login");
        } catch (error: any) {
            console.error("Reset password error:", error);
            // Extract error message from response if possible
            const msg = error.message || "Failed to reset password. The link may be invalid or expired.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-md bg-black rounded-lg shadow-lg p-8 border border-[#FF2400]">
                <h1 className="text-3xl font-bold text-center mb-2 text-[#FF2400]">LEXIE ERP</h1>
                <p className="text-center text-[#FF2400] mb-8">Set new password</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#FF2400] mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-black border border-[#FF2400] rounded-lg text-[#FF2400] placeholder-[#FF2400]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2400]"
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#FF2400] mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-black border border-[#FF2400] rounded-lg text-[#FF2400] placeholder-[#FF2400]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2400]"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#FF2400] hover:bg-[#cc1d00] text-black font-bold py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
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
            </div>
        </div>
    );
}
