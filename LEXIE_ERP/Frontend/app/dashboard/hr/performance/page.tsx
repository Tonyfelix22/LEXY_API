"use client";

import { useState, useEffect } from "react";
import { performanceService, PerformanceGoal, PerformanceReview } from "@/services/performanceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, FileText, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/utils/api";

export default function PerformancePage() {
    const [goals, setGoals] = useState<PerformanceGoal[]>([]);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [employees, setEmployees] = useState<{ id: number, first_name: string, last_name: string }[]>([]);

    // Create Goal State
    const [isGoalOpen, setIsGoalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState<Partial<PerformanceGoal>>({ status: 'PENDING', progress: 0 });

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsData, reviewsData] = await Promise.all([
                performanceService.getGoals(),
                performanceService.getReviews()
            ]);
            setGoals(goalsData);
            setReviews(reviewsData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await apiFetch("/hr/employees/");
            setEmployees(data.results || data);
        } catch (error) {
            console.error("Failed to load employees");
        }
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await performanceService.createGoal(newGoal as PerformanceGoal);
            toast.success("Goal created");
            setIsGoalOpen(false);
            setNewGoal({ status: 'PENDING', progress: 0 });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to create goal");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-green-500/20 text-green-400 border border-green-500/50";
            case "IN_PROGRESS": return "bg-sky-500/20 text-sky-400 border border-sky-500/50";
            case "PENDING": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
            case "CANCELLED": return "bg-red-500/20 text-red-400 border border-red-500/50";
            default: return "bg-slate-700/20 text-slate-400 border border-slate-700/50";
        }
    };

    return (
        <div className="space-y-8 bg-slate-900 min-h-screen p-8 rounded-3xl border border-slate-800">
            <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Performance Management</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Monitor organizational performance through objectives and structured reviews</p>
                </div>
            </div>

            <Tabs defaultValue="goals" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <TabsList className="bg-slate-800 backdrop-blur-sm border-2 border-slate-700 p-1 rounded-2xl self-start">
                    <TabsTrigger value="goals" className="rounded-xl px-12 py-3 font-bold data-[state=active]:bg-sky-500 data-[state=active]:text-white text-slate-400 transition-all">Objectives & Goals</TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-xl px-12 py-3 font-bold data-[state=active]:bg-sky-500 data-[state=active]:text-white text-slate-400 transition-all">Performance Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 rounded-xl font-bold px-6 py-6 h-auto">
                                    <Plus className="mr-2 h-5 w-5" /> Define New Objective
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl border-2 border-slate-700 shadow-2xl bg-slate-800">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-white">Set Performance Objective</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateGoal} className="space-y-6 py-4">
                                    <div className="space-y-3">
                                        <Label className="font-bold text-sky-400 uppercase text-xs tracking-widest">Target Employee</Label>
                                        <Select
                                            value={String(newGoal.employee || "")}
                                            onValueChange={(v) => setNewGoal({ ...newGoal, employee: Number(v) })}
                                        >
                                            <SelectTrigger className="rounded-xl border-2 border-slate-700 h-12 font-bold text-white bg-slate-900">
                                                <SelectValue placeholder="Select Professional" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-2 border-slate-700 bg-slate-800 text-white">
                                                {employees.map(e => (
                                                    <SelectItem key={e.id} value={String(e.id)} className="font-bold text-white focus:bg-sky-500/10 focus:text-sky-400">
                                                        {e.first_name} {e.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-sky-400 uppercase text-xs tracking-widest">Goal Headline</Label>
                                        <Input required className="rounded-xl border-2 border-slate-700 h-12 font-bold text-white bg-slate-900 placeholder:text-slate-500" placeholder="e.g. Increase Quarterly Revenue by 15%" value={newGoal.title || ""} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-sky-400 uppercase text-xs tracking-widest">Target Completion Date</Label>
                                        <Input type="date" className="rounded-xl border-2 border-slate-700 h-12 font-bold text-white bg-slate-900" value={newGoal.due_date || ""} onChange={e => setNewGoal({ ...newGoal, due_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-sky-400 uppercase text-xs tracking-widest">Objective Details</Label>
                                        <Textarea className="rounded-xl border-2 border-slate-700 min-h-[120px] font-medium text-white bg-slate-900 placeholder:text-slate-500" placeholder="Detail the key results and success criteria..." value={newGoal.description || ""} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} />
                                    </div>
                                    <Button type="submit" className="w-full bg-sky-500 text-white font-bold py-6 rounded-2xl shadow-xl hover:bg-sky-600 transition-all">Publish Objective</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {goals.map(goal => (
                            <Card key={goal.id} className="rounded-[2rem] border-2 border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-slate-800 group overflow-hidden">
                                <CardHeader className="pb-4 relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Target className="w-16 h-16 text-sky-400" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className={`${getStatusColor(goal.status)} font-bold px-3 py-1 rounded-full text-[10px]`}>{goal.status}</Badge>
                                        {goal.due_date && (
                                            <div className="flex items-center text-sky-400 font-bold text-[10px] uppercase">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                Due {format(new Date(goal.due_date), "MMM d, yyyy")}
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-extrabold text-white group-hover:text-sky-400 transition-colors">{goal.title}</CardTitle>
                                    <p className="text-sky-400 font-bold text-xs tracking-widest uppercase flex items-center gap-2 mt-2">
                                        <Users className="h-3 w-3" />
                                        {goal.employee_name}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 pt-4">
                                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 font-medium">{goal.description}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Progress</span>
                                                <span className="text-sm font-black text-white">{goal.progress}%</span>
                                            </div>
                                            <Progress value={goal.progress} className="h-2.5 bg-slate-900 rounded-full [&>div]:bg-sky-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {goals.length === 0 && (
                            <div className="col-span-full py-24 text-center bg-slate-800/40 rounded-[3rem] border-2 border-dashed border-slate-700">
                                <Target className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-500">No organizational goals defined yet</h3>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                    <div className="flex justify-end">
                        <Link href="/dashboard/hr/performance/reviews/create">
                            <Button className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 rounded-xl font-bold px-6 py-6 h-auto">
                                <Plus className="mr-2 h-5 w-5" /> Schedule Assessment
                            </Button>
                        </Link>
                    </div>

                    <Card className="rounded-[2.5rem] border-2 border-slate-700 shadow-2xl overflow-hidden bg-slate-800">
                        <CardHeader className="bg-slate-900 border-b border-slate-700 p-8">
                            <CardTitle className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white">
                                <FileText className="h-6 w-6 text-sky-400" />
                                Performance Assessment Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-slate-400">
                                    <thead>
                                        <tr className="bg-slate-900/50 text-sky-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-700">
                                            <th className="px-8 py-6 text-left">Employee Name</th>
                                            <th className="px-8 py-6 text-left">Assigned Reviewer</th>
                                            <th className="px-8 py-6 text-left">Assessment Period</th>
                                            <th className="px-8 py-6 text-left">Current Status</th>
                                            <th className="px-8 py-6 text-left">Overall Rating</th>
                                            <th className="px-8 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {reviews.map(review => (
                                            <tr key={review.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="font-extrabold text-white text-base">{review.employee_name}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider">{review.reviewer_name || "Unassigned"}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center text-sky-400 font-bold text-xs uppercase bg-sky-500/10 w-fit px-3 py-1 rounded-lg border border-sky-500/20">
                                                        {format(new Date(review.review_period_start), "MMM d")} &rarr; {format(new Date(review.review_period_end), "MMM d, yyyy")}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="outline" className="border-2 border-sky-500/20 font-black text-sky-400 text-[10px] uppercase rounded-full px-3 py-1">{review.status}</Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {review.rating ? (
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <div key={star} className={`w-2 h-2 rounded-full ${star <= review.rating! ? "bg-sky-400 shadow-glow" : "bg-slate-900 border border-slate-700"}`} />
                                                            ))}
                                                            <span className="ml-2 font-black text-white">{review.rating}/5</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 font-black italic text-xs uppercase tracking-widest">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Link href={`/dashboard/hr/performance/reviews/${review.id}`}>
                                                        <Button size="sm" className="bg-slate-900 hover:bg-sky-500 text-sky-400 hover:text-white font-black text-[10px] uppercase rounded-xl px-4 transition-all border border-slate-700 hover:border-sky-500">View Analytics</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
