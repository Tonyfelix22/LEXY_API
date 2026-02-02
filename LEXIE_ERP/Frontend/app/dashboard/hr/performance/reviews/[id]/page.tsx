"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { performanceService, PerformanceReview } from "@/services/performanceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ReviewDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [review, setReview] = useState<PerformanceReview | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State for updates
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (params.id) fetchData(Number(params.id));
    }, [params.id]);

    const fetchData = async (id: number) => {
        try {
            const data = await performanceService.getReview(id);
            setReview(data);
            setRating(data.rating || 0);
            setFeedback(data.feedback || "");
            setStatus(data.status);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load review");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!review) return;
        try {
            await performanceService.updateReview(review.id!, {
                rating,
                feedback,
                status: status as any
            });
            toast.success("Review updated");
            fetchData(review.id!);
        } catch (error: any) {
            toast.error(error.message || "Failed to update review");
        }
    };

    const handleComplete = async () => {
        if (!review) return;
        try {
            await performanceService.updateReview(review.id!, {
                rating,
                feedback,
                status: 'COMPLETED'
            });
            toast.success("Review completed");
            fetchData(review.id!);
        } catch (error: any) {
            toast.error(error.message || "Failed to complete review");
        }
    };

    if (loading) return <div className="p-8 text-sky-400 animate-pulse font-black uppercase tracking-widest">Loading...</div>;
    if (!review) return <div className="p-8 text-slate-400 font-black uppercase tracking-widest">Review not found</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen rounded-[2.5rem] border border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/hr/performance">
                        <Button variant="outline" size="icon" className="border-slate-700 text-sky-400 hover:bg-sky-500 hover:text-white bg-slate-800">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Performance Review</h1>
                        <p className="text-slate-400">{review.employee_name}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-4 border-sky-500 text-sky-400 bg-sky-500/10">{review.status}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-1 border-slate-700 bg-slate-800 rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">Reviewer</p>
                            <p className="font-bold text-sky-400 mt-1">{review.reviewer_name || "Not assigned"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">Period</p>
                            <p className="text-sm font-medium text-white mt-1">
                                {format(new Date(review.review_period_start), "MMM d, yyyy")} - <br />
                                {format(new Date(review.review_period_end), "MMM d, yyyy")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">Review Date</p>
                            <p className="text-sm font-medium text-white mt-1">{review.review_date ? format(new Date(review.review_date), "PPP") : "-"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 border-slate-700 bg-slate-800 rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-white">Evaluation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base text-sky-400 font-bold">Rating (1-5)</Label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={review.status === 'COMPLETED'}
                                        onClick={() => setRating(star)}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2 ${rating >= star
                                            ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/30 transform scale-110"
                                            : "bg-slate-900 text-slate-500 border-slate-700 hover:border-sky-500/50"
                                            }`}
                                    >
                                        {star}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base text-sky-400 font-bold">Feedback & Comments</Label>
                            <Textarea
                                className="min-h-[200px] bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-sky-500 resize-none"
                                placeholder="Enter detailed feedback here..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                disabled={review.status === 'COMPLETED'}
                            />
                        </div>
                    </CardContent>
                    {review.status !== 'COMPLETED' && (
                        <CardFooter className="flex justify-between border-t border-slate-700 pt-6">
                            <Button variant="outline" onClick={handleSave} className="border-sky-500/20 text-sky-400 hover:bg-sky-500/10 bg-transparent">Save Draft</Button>
                            <Button onClick={handleComplete} className="bg-sky-500 hover:bg-sky-600 text-white font-bold">
                                <CheckCircle className="mr-2 h-4 w-4" /> Finalize & Complete
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
