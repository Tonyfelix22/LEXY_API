"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { recruitmentService } from "@/services/recruitmentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

type Department = { id: number; name: string };

export default function CreateJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        department: "",
        job_description: "",
        requirements: "",
        status: "DRAFT",
        closing_date: "",
    });

    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const data = await apiFetch("/hr/departments/");
                setDepartments(data.results || data);
            } catch (error) {
                console.error("Failed to load departments");
            }
        };
        fetchDeps();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await recruitmentService.createJob({
                ...formData,
                department: parseInt(formData.department),
                status: formData.status as any,
            });
            toast.success("Job posting created");
            router.push("/dashboard/hr/recruitment");
        } catch (error: any) {
            toast.error(error.message || "Failed to create job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 bg-white min-h-screen p-8 rounded-3xl border border-[#0ea5e9]">
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <Link href="/dashboard/hr/recruitment">
                    <Button variant="outline" size="icon" className="rounded-xl border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#1e3a8a]">Create Vacancy</h1>
                    <p className="text-[#1e3a8a]/70 font-black uppercase text-xs tracking-widest">Define new opportunities for internal or external candidates</p>
                </div>
            </div>

            <Card className="max-w-3xl mx-auto rounded-[2rem] border-2 border-[#1e3a8a] shadow-2xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="bg-[#1e3a8a] text-white p-8">
                    <CardTitle className="text-2xl font-black uppercase tracking-[0.3em]">Job Requisition Details</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Official Job Title</Label>
                                <Input
                                    required
                                    className="h-14 rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] bg-white"
                                    placeholder="e.g. Senior Software Engineer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Target Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(v) => setFormData({ ...formData, department: v })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] bg-white">
                                        <SelectValue placeholder="Select Organizational Unit" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 border-[#0ea5e9] shadow-xl bg-white">
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)} className="font-bold py-3 text-[#1e3a8a] uppercase text-xs tracking-widest">{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Posting Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 border-[#0ea5e9] shadow-xl bg-white">
                                        <SelectItem value="DRAFT" className="py-3 font-black text-black uppercase text-xs tracking-widest">Draft / Internal Review</SelectItem>
                                        <SelectItem value="OPEN" className="py-3 font-black text-[#0ea5e9] uppercase text-xs tracking-widest">Open for Applications</SelectItem>
                                        <SelectItem value="CLOSED" className="py-3 font-black text-[#1e3a8a] uppercase text-xs tracking-widest">Closed / Fulfilled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Closing Date (Optional)</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] bg-white"
                                    value={formData.closing_date}
                                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Job Mission & Description</Label>
                            <Textarea
                                className="min-h-[150px] rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] p-6 leading-relaxed bg-white"
                                required
                                placeholder="Describe the core responsibilities and mission of this role..."
                                value={formData.job_description}
                                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Required Skills & Expertise</Label>
                            <Textarea
                                className="min-h-[150px] rounded-2xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] focus:ring-0 transition-all font-bold text-[#1e3a8a] p-6 leading-relaxed bg-white"
                                required
                                placeholder="List mandatory qualifications, years of experience, and specific technical skills..."
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-[#1e3a8a] text-white font-black py-8 rounded-2xl shadow-xl hover:bg-[#0ea5e9] transition-all text-lg uppercase tracking-[0.3em] disabled:opacity-50" disabled={loading}>
                            {loading ? "Publishing..." : "Publish Vacancy"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
