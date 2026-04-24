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
    const [managers, setManagers] = useState<{ id: number, first_name: string, last_name: string }[]>([]);
    const [hasScheduledReview, setHasScheduledReview] = useState(false);

    const [formData, setFormData] = useState({
        employee: "",
        reviewer: "",
        review_period_start: "",
        review_period_end: "",
        status: "SCHEDULED",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empsData, mgrsData] = await Promise.all([
                    apiFetch("/hr/employees/all_employees/"),
                    apiFetch("/hr/employees/managers/")
                ]);
                setEmployees(empsData);
                setManagers(mgrsData);
            } catch (error) {
                console.error("Failed to load data");
            }
        };
        fetchData();
    }, []);

    // Automatically check if employee already has a scheduled review and redirect
    useEffect(() => {
        const checkExistingReview = async () => {
            if (!formData.employee) {
                setHasScheduledReview(false);
                return;
            }

            try {
                const existingReviews = await performanceService.getReviews(parseInt(formData.employee));
                
                // Check if any review is already scheduled or completed
                const hasScheduled = existingReviews.some(review => 
                    review.status === 'SCHEDULED' || review.status === 'COMPLETED'
                );

                setHasScheduledReview(hasScheduled);

                if (hasScheduled) {
                    const scheduledReview = existingReviews.find(review => 
                        review.status === 'SCHEDULED' || review.status === 'COMPLETED'
                    );
                    
                    toast.error(
                        `This employee already has a performance review ${scheduledReview?.status.toLowerCase()} ` +
                        `for the period ${scheduledReview?.review_period_start} to ${scheduledReview?.review_period_end}. ` +
                        `Redirecting...`
                    );
                    
                    // Automatically redirect after a short delay
                    setTimeout(() => {
                        router.push("/dashboard/hr/performance");
                    }, 2000);
                }
            } catch (error) {
                console.error("Failed to check existing reviews");
            }
        };

        checkExistingReview();
    }, [formData.employee, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate date range
            const startDate = new Date(formData.review_period_start);
            const endDate = new Date(formData.review_period_end);

            if (startDate > endDate) {
                toast.error("Review period end date cannot be before the start date.");
                setLoading(false);
                return;
            }

            // Prevent employee from reviewing themselves
            if (formData.employee && formData.reviewer) {
                if (formData.employee === formData.reviewer) {
                    toast.error("An employee cannot review themselves. Please select a different reviewer.");
                    setLoading(false);
                    return;
                }
            }

            // Fetch existing reviews to check for conflicts
            const existingReviews = await performanceService.getReviews(parseInt(formData.employee));

            // Check for overlapping reviews with SCHEDULED or COMPLETED status
            const hasConflict = existingReviews.some(review => {
                const existingStart = new Date(review.review_period_start);
                const existingEnd = new Date(review.review_period_end);

                // Check if periods overlap
                const isOverlapping = existingStart <= endDate && existingEnd >= startDate;

                // Check if the existing review is scheduled or completed
                const isScheduledOrCompleted = review.status === 'SCHEDULED' || review.status === 'COMPLETED';

                return isOverlapping && isScheduledOrCompleted;
            });

            if (hasConflict) {
                const conflictingReview = existingReviews.find(review => {
                    const existingStart = new Date(review.review_period_start);
                    const existingEnd = new Date(review.review_period_end);
                    const isOverlapping = existingStart <= endDate && existingEnd >= startDate;
                    return isOverlapping && (review.status === 'SCHEDULED' || review.status === 'COMPLETED');
                });

                if (conflictingReview) {
                    toast.error(
                        `This employee already has a performance review scheduled for the period ` +
                        `${conflictingReview.review_period_start} to ${conflictingReview.review_period_end}. ` +
                        `Current status: ${conflictingReview.status}.`
                    );
                    setLoading(false);
                    return;
                }
            }

            await performanceService.createReview({
                ...formData,
                employee: parseInt(formData.employee),
                reviewer: formData.reviewer ? parseInt(formData.reviewer) : undefined,
                status: formData.status as any,
            });
            toast.success("Review scheduled");
            router.push("/dashboard/hr/performance");
        } catch (error: any) {
            // Handle backend validation errors
            if (error.errors) {
                // Backend validation error (e.g., duplicate check, self-review)
                const errorMsg = Object.values(error.errors).flat().join(' ');
                toast.error(errorMsg);
            } else {
                toast.error(error.message || "Failed to schedule review");
            }
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

            {hasScheduledReview && (
                <Card className="border-red-500 bg-red-500/10">
                    <CardContent className="py-6">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-400 font-semibold">
                                This employee already has a scheduled review. Redirecting to performance page...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className={hasScheduledReview ? "opacity-50 pointer-events-none" : ""}>
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
                                    disabled={hasScheduledReview}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Reviewer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {managers.map((e) => (
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
                                    disabled={hasScheduledReview}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Period End</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.review_period_end}
                                    onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                                    disabled={hasScheduledReview}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                disabled={hasScheduledReview}
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

                        <Button type="submit" className="w-full" disabled={loading || hasScheduledReview}>
                            {loading ? "Saving..." : "Schedule Review"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
