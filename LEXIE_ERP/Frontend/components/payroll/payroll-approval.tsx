"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/utils/api"; // centralized API helper with token injection
import { useAuth } from "@/context/auth-context"; // ✅ pull role from auth context instead of localStorage

interface PayrollRun {
    id: number;
    employee_name: string;
    staff_number: string;
    period_start: string;
    period_end: string;
    status: "DRAFT" | "CALCULATED" | "APPROVED" | "POSTED";
    net_salary: number;
    is_posted_to_finance?: boolean;
}

export default function PayrollApproval() {
    const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth(); // ✅ Secure, backend-synced user
    const userRole = user?.role || "GUEST";

    // =============================
    // FETCH PAYROLLS
    // =============================
    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/hr/payroll_runs/");
            const list = Array.isArray(data) ? data : data.results || [];
            setPayrolls(list);
        } catch (err: any) {
            console.error("❌ Error fetching payrolls:", err);
            setError(err.message || "Failed to load payrolls.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrolls();
    }, []);

    // =============================
    // ACTION HANDLERS
    // =============================
    const handleCalculate = async (id: number) => {
        try {
            await apiFetch(`/hr/payroll_runs/${id}/calculate/`, { method: "POST" });
            toast.success("✅ Payroll calculated successfully.");
            fetchPayrolls();
        } catch (err: any) {
            toast.error(err.message || "Error calculating payroll.");
        }
    };

    const handleApprove = async (id: number) => {
        if (userRole !== "FINANCE" && userRole !== "ADMIN") {
            toast.error("🚫 Only Finance/Admin can approve payrolls.");
            return;
        }
        try {
            await apiFetch(`/hr/payroll_runs/${id}/approve/`, { method: "POST" });
            toast.success("✅ Payroll approved successfully.");
            fetchPayrolls();
        } catch (err: any) {
            toast.error(err.message || "Error approving payroll.");
        }
    };

    const handlePostToFinance = async (id: number) => {
        if (userRole !== "FINANCE" && userRole !== "ADMIN") {
            toast.error("🚫 Only Finance/Admin can post to finance.");
            return;
        }
        try {
            await apiFetch(`/hr/payroll_runs/${id}/post_to_finance/`, { method: "POST" });
            toast.success("📘 Payroll posted to Finance successfully.");
            fetchPayrolls();
        } catch (err: any) {
            toast.error(err.message || "Error posting payroll.");
        }
    };

    // =============================
    // RENDER STATES
    // =============================
    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );

    if (error)
        return (
            <p className="text-center text-red-500 font-medium mt-6">
                ⚠️ Error: {error}
            </p>
        );

    if (!payrolls.length)
        return (
            <p className="text-center text-gray-500 mt-6">No payrolls found.</p>
        );

    // =============================
    // MAIN RENDER
    // =============================
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">
                    Payroll Approval Dashboard
                </h1>
                <span className="text-sm text-muted-foreground">
          Role: <strong>{userRole}</strong>
        </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {payrolls.map((p) => (
                    <Card
                        key={p.id}
                        className="rounded-2xl border border-border shadow-sm hover:shadow-md transition"
                    >
                        <CardContent className="p-4 space-y-3">
                            <div className="font-semibold text-lg text-foreground">
                                {p.employee_name || "Unknown Employee"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Staff No: {p.staff_number || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Period: {p.period_start} → {p.period_end}
                            </div>

                            <div className="text-sm">
                                <strong>Status:</strong>{" "}
                                <span
                                    className={`px-2 py-1 rounded text-white text-xs ${
                                        p.status === "DRAFT"
                                            ? "bg-gray-500"
                                            : p.status === "CALCULATED"
                                                ? "bg-blue-500"
                                                : p.status === "APPROVED"
                                                    ? "bg-green-500"
                                                    : "bg-purple-600"
                                    }`}
                                >
                  {p.status}
                </span>
                            </div>

                            <div className="text-sm text-foreground">
                                Net Salary:{" "}
                                <span className="font-semibold">
                  {p.net_salary.toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                      maximumFractionDigits: 0,
                  })}
                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-3">
                                {p.status === "DRAFT" && (
                                    <Button
                                        onClick={() => handleCalculate(p.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Calculate
                                    </Button>
                                )}

                                {p.status === "CALCULATED" &&
                                    ["FINANCE", "ADMIN"].includes(userRole) && (
                                        <Button
                                            onClick={() => handleApprove(p.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                        >
                                            Approve
                                        </Button>
                                    )}

                                {p.status === "APPROVED" && !p.is_posted_to_finance && (
                                    <Button
                                        onClick={() => handlePostToFinance(p.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        Post to Finance
                                    </Button>
                                )}

                                {p.is_posted_to_finance && (
                                    <Button disabled className="bg-gray-300 text-gray-600">
                                        ✅ Posted
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
