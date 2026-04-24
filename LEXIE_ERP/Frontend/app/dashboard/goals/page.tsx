"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { performanceService, PerformanceGoal } from "@/services/performanceService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GoalsDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const [goals, setGoals] = useState<PerformanceGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("PENDING");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!authLoading && user) {
            fetchGoals();
        }
    }, [user, authLoading]);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            // Fetch goals for the logged-in employee if they have an employee profile
            const employeeId = user?.employee?.id;
            const data = await performanceService.getGoals(employeeId);
            setGoals(data);
        } catch (error) {
            console.error("Failed to fetch goals", error);
            toast.error("Failed to load goals");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.employee?.id) {
            toast.error("You must have an employee profile to create a goal.");
            return;
        }

        try {
            await performanceService.createGoal({
                employee: user.employee.id,
                title,
                description,
                due_date: dueDate || undefined,
                status,
                progress: Number(progress),
            });

            toast.success("Goal created successfully");
            setIsCreateOpen(false);
            fetchGoals();

            // Reset form
            setTitle("");
            setDescription("");
            setDueDate("");
            setStatus("PENDING");
            setProgress(0);
        } catch (error) {
            console.error("Failed to create goal", error);
            toast.error("Failed to create goal. Please try again.");
        }
    };

    const getStatusColor = (goalStatus: string) => {
        switch (goalStatus) {
            case "COMPLETED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            case "IN_PROGRESS": return "text-sky-400 bg-sky-400/10 border-sky-400/20";
            case "PENDING": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
            case "CANCELLED": return "text-red-400 bg-red-400/10 border-red-400/20";
            default: return "text-slate-400 bg-slate-800 border-slate-700";
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="text-sky-400 animate-pulse font-semibold tracking-widest uppercase">
                    Loading Goals...
                </div>
            </div>
        );
    }

    if (!user?.employee?.id && !user?.is_superuser) {
        return (
            <div className="p-8 text-center bg-slate-900 min-h-screen">
                <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl mt-12">
                    <span className="material-symbols-outlined text-[48px] text-amber-500 mb-4 block">warning</span>
                    <h2 className="text-xl font-bold text-white mb-2">Profile Required</h2>
                    <p className="text-slate-400 text-sm mb-6">You need an active employee profile linked to your account to manage goals.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-900 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">My Goals</h1>
                    <p className="text-slate-400 mt-2">Track and manage your performance objectives</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_task</span>
                            Create New Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">Create Performance Goal</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateGoal} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-slate-300">Goal Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Complete Q3 Certification"
                                    className="bg-slate-900 border-slate-700 focus:border-sky-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-slate-300">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your goal and success criteria..."
                                    className="bg-slate-900 border-slate-700 focus:border-sky-500 min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate" className="text-slate-300">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="bg-slate-900 border-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-slate-300">Initial Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(val: any) => setStatus(val)}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            <SelectItem value="PENDING" className="focus:bg-slate-700">Pending</SelectItem>
                                            <SelectItem value="IN_PROGRESS" className="focus:bg-slate-700">In Progress</SelectItem>
                                            <SelectItem value="COMPLETED" className="focus:bg-slate-700">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
                                    Save Goal
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {goals.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-slate-500 mb-4 block">flag</span>
                    <h3 className="text-lg font-medium text-slate-300">No Goals Found</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">You haven't set any performance goals yet. Create a goal to start tracking your objectives and progress.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {goals.map((goal) => (
                        <Card key={goal.id} className="bg-slate-800 border-slate-700 shadow-sm hover:shadow-md transition-shadow hover:border-slate-600 overflow-hidden group">
                            <CardHeader className="pb-3 border-b border-slate-700/50 bg-slate-800/80">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-lg font-semibold text-white leading-tight">
                                        {goal.title}
                                    </CardTitle>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${getStatusColor(goal.status)}`}>
                                        {goal.status.replace("_", " ")}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <p className="text-sm text-slate-400 line-clamp-3 min-h-[60px]">
                                    {goal.description || "No description provided."}
                                </p>

                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-500">Progress</span>
                                        <span className={goal.progress === 100 ? "text-emerald-400" : "text-sky-400"}>{goal.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {goal.due_date && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 pb-1">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                        <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
