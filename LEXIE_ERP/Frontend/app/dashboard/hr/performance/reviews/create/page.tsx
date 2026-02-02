"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performanceService } from "@/services/performanceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function CreateReviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<{ id: number, first_name: string, last_name: string }[]>([]);

    const [formData, setFormData] = useState({
        employee: "",
        reviewer: "",
        review_period_start: "",
        review_period_end: "",
        status: "SCHEDULED",
    });

    useEffect(() => {
        const fetchEmps = async () => {
            try {
                const data = await apiFetch("/hr/employees/");
                setEmployees(data.results || data);
            } catch (error) {
                console.error("Failed to load employees");
            }
        };
        fetchEmps();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await performanceService.createReview({
                ...formData,
                employee: parseInt(formData.employee),
                reviewer: formData.reviewer ? parseInt(formData.reviewer) : undefined,
                status: formData.status as any,
            });
            toast.success("Review scheduled");
            router.push("/dashboard/hr/performance");
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/hr/performance">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Schedule Performance Review</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Review Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Employee (To be reviewed)</Label>
                                <Select
                                    value={formData.employee}
                                    onValueChange={(v) => setFormData({ ...formData, employee: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reviewer (Manager)</Label>
                                <Select
                                    value={formData.reviewer}
                                    onValueChange={(v) => setFormData({ ...formData, reviewer: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Reviewer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Period Start</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.review_period_start}
                                    onChange={(e) => setFormData({ ...formData, review_period_start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Period End</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.review_period_end}
                                    onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Saving..." : "Schedule Review"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
