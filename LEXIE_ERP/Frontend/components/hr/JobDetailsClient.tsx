"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { recruitmentService, JobPosting, Applicant } from "@/services/recruitmentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, UserCircle, Briefcase, Mail, Phone, Calendar, FileText, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function JobDetailsClient() {
    const params = useParams();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newApplicant, setNewApplicant] = useState<Partial<Applicant>>({});

    useEffect(() => {
        if (params.id) fetchData(Number(params.id));
    }, [params.id]);

    const fetchData = async (id: number) => {
        try {
            const [jobData, applicantsData] = await Promise.all([
                recruitmentService.getJob(id),
                recruitmentService.getApplicants(id)
            ]);
            setJob(jobData);
            setApplicants(applicantsData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddApplicant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;
        try {
            await recruitmentService.createApplicant({
                ...newApplicant as Applicant,
                job_posting: job.id!,
                status: 'APPLIED'
            });
            toast.success("Applicant added");
            setIsAddOpen(false);
            setNewApplicant({});
            fetchData(job.id!);
        } catch (error: any) {
            toast.error(error.message || "Failed to add applicant");
        }
    };

    const handleStatusChange = async (applicantId: number, newStatus: string) => {
        try {
            await recruitmentService.updateApplicantStatus(applicantId, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            // Optimistic update
            setApplicants(apps => apps.map(a => a.id === applicantId ? { ...a, status: newStatus as any } : a));
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const columns = [
        { id: 'APPLIED', title: 'Applied', color: 'border-[#1e3a8a]' },
        { id: 'SCREENING', title: 'Screening', color: 'border-[#1e3a8a]' },
        { id: 'INTERVIEW', title: 'Interview', color: 'border-[#1e3a8a]' },
        { id: 'OFFER_SENT', title: 'Offer Sent', color: 'border-[#0ea5e9]' },
        { id: 'HIRED', title: 'Hired', color: 'border-[#0ea5e9]' },
        { id: 'REJECTED', title: 'Rejected', color: 'border-black' },
    ];

    if (loading) return <div className="p-8 text-[#1e3a8a] font-bold">Loading...</div>;
    if (!job) return <div className="p-8 text-[#1e3a8a] font-bold">Job not found</div>;

    return (
        <div className="space-y-8 bg-white min-h-screen p-8 rounded-3xl border border-[#0ea5e9] flex flex-col">
            {/* Header section */}
            <div className="flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/hr/recruitment">
                        <Button variant="outline" size="icon" className="rounded-xl border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-extrabold text-[#1e3a8a]">{job.title}</h1>
                            <Badge className={`${job.status === 'OPEN' ? 'bg-[#0ea5e9]' : 'bg-black'} text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest`}>
                                {job.status}
                            </Badge>
                        </div>
                        <p className="text-[#0ea5e9] font-black text-sm tracking-widest flex items-center gap-2 uppercase">
                            <Briefcase className="h-4 w-4" />
                            {job.department_name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#1e3a8a] hover:bg-[#0ea5e9] text-white shadow-lg rounded-xl font-bold uppercase tracking-widest px-6 py-6 h-auto">
                                <Plus className="mr-2 h-5 w-5" /> Add Candidate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-2 border-[#1e3a8a] shadow-2xl bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-[#1e3a8a] uppercase tracking-widest">Manual Candidate Entry</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddApplicant} className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest">First Name</Label>
                                        <Input required className="rounded-xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] transition-all font-bold text-[#1e3a8a]" value={newApplicant.first_name || ""} onChange={e => setNewApplicant({ ...newApplicant, first_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest">Last Name</Label>
                                        <Input required className="rounded-xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] transition-all font-bold text-[#1e3a8a]" value={newApplicant.last_name || ""} onChange={e => setNewApplicant({ ...newApplicant, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest">Email Address</Label>
                                    <Input type="email" required className="rounded-xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] transition-all font-bold text-[#1e3a8a]" value={newApplicant.email || ""} onChange={e => setNewApplicant({ ...newApplicant, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest">Resume/Portfolio Link</Label>
                                    <Input className="rounded-xl border-2 border-[#1e3a8a]/10 focus:border-[#0ea5e9] transition-all font-bold text-[#1e3a8a]" value={newApplicant.resume_link || ""} onChange={e => setNewApplicant({ ...newApplicant, resume_link: e.target.value })} placeholder="https://..." />
                                </div>
                                <Button type="submit" className="w-full bg-[#1e3a8a] hover:bg-[#0ea5e9] text-white font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em]">Save Profile</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <TabsList className="shrink-0 bg-white border-2 border-[#1e3a8a] p-1 rounded-2xl self-start mb-6">
                    <TabsTrigger value="board" className="rounded-xl px-8 py-2.5 font-black uppercase tracking-widest data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all text-xs">Board</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl px-8 py-2.5 font-black uppercase tracking-widest data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all text-xs">List</TabsTrigger>
                    <TabsTrigger value="details" className="rounded-xl px-8 py-2.5 font-black uppercase tracking-widest data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all text-xs">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="board" className="flex-1 min-h-0 mt-0 overflow-x-auto pb-6 scrollbar-hide">
                    <div className="flex gap-6 h-full min-w-max">
                        {columns.map((col, idx) => (
                            <div key={col.id} className={`w-[22rem] rounded-[2rem] p-4 flex flex-col bg-white border-2 ${col.color} shadow-sm animate-in fade-in slide-in-from-right-4 duration-500`} style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="px-4 py-3 mb-4 flex justify-between items-center bg-[#1e3a8a] rounded-2xl shadow-md border-b-4 border-[#0ea5e9]">
                                    <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">
                                        {col.title}
                                    </h3>
                                    <Badge className="bg-[#0ea5e9] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-2 border-white/20">
                                        {applicants.filter(a => a.status === col.id).length}
                                    </Badge>
                                </div>
                                <div className="space-y-4 flex-1 overflow-y-auto px-1 pt-1 pb-4 scrollbar-hide">
                                    {applicants.filter(a => a.status === col.id).map(applicant => (
                                        <Card key={applicant.id} className="group relative cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-[#1e3a8a]/5 hover:border-[#0ea5e9] rounded-2xl bg-white overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1e3a8a] group-hover:bg-[#0ea5e9] transition-colors" />
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-black text-[#1e3a8a] text-lg leading-tight flex items-center gap-2 uppercase tracking-tight">
                                                        {applicant.full_name}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="text-[10px] font-black text-[#1e3a8a]/50 flex items-center gap-2 uppercase tracking-widest">
                                                        <Mail className="h-3 w-3 text-[#0ea5e9]" />
                                                        {applicant.email}
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <Label className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest mb-1.5 block">Update Stage</Label>
                                                    <Select
                                                        value={applicant.status}
                                                        onValueChange={(v) => handleStatusChange(applicant.id!, v)}
                                                    >
                                                        <SelectTrigger className="h-10 text-xs font-black uppercase tracking-widest bg-white border-2 border-[#1e3a8a]/10 rounded-xl focus:ring-0 focus:border-[#0ea5e9] transition-all text-[#1e3a8a]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-2 border-[#0ea5e9] bg-white">
                                                            {columns.map(c => (
                                                                <SelectItem key={c.id} value={c.id} className="font-black text-[#1e3a8a] uppercase text-[10px] tracking-widest">{c.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {applicant.resume_link && (
                                                    <div className="pt-2 border-t border-[#1e3a8a]/5 mt-2">
                                                        <a href={applicant.resume_link} target="_blank" className="text-[10px] font-black text-[#0ea5e9] hover:text-[#1e3a8a] flex items-center gap-2 transition-colors uppercase tracking-[0.2em]">
                                                            <FileText className="h-3 w-3" />
                                                            Review Profile
                                                        </a>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {applicants.filter(a => a.status === col.id).length === 0 && (
                                        <div className="h-32 rounded-2xl border-4 border-dotted border-[#1e3a8a]/10 flex flex-col items-center justify-center p-4">
                                            <p className="text-[10px] font-black text-[#1e3a8a]/30 uppercase tracking-[0.2em] text-center">Empty Stage</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0 flex-1 overflow-y-auto">
                    <Card className="rounded-[2rem] border-2 border-[#1e3a8a] shadow-lg overflow-hidden border-t-0 rounded-t-none bg-white">
                        <CardHeader className="bg-[#1e3a8a] text-white p-6">
                            <CardTitle className="text-xl font-black uppercase tracking-[0.3em]">Master Candidate List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#1e3a8a]/5 text-[#1e3a8a] font-black text-[10px] uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5 text-left">Candidate Name</th>
                                        <th className="px-8 py-5 text-left">Contact Info</th>
                                        <th className="px-8 py-5 text-left">Hiring Stage</th>
                                        <th className="px-8 py-5 text-left">Application Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e3a8a]/10">
                                    {applicants.map(app => (
                                        <tr key={app.id} className="hover:bg-[#0ea5e9]/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-black text-[#1e3a8a] text-base uppercase tracking-tight">{app.full_name}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[#1e3a8a]/70 font-bold text-xs uppercase tracking-widest">{app.email}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className="bg-[#0ea5e9] text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
                                                    {app.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-[#1e3a8a]/40 font-black text-xs uppercase tracking-tighter">
                                                {format(new Date(app.created_at!), "MMM d, yyyy")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details" className="mt-0 flex-1 overflow-y-auto space-y-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-[2rem] border-2 border-[#1e3a8a] shadow-lg bg-white overflow-hidden">
                            <CardHeader className="bg-[#1e3a8a] text-white p-6">
                                <CardTitle className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Job Mission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 text-[#1e3a8a] font-bold leading-relaxed whitespace-pre-wrap text-base">
                                {job.job_description}
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2rem] border-2 border-[#0ea5e9] shadow-lg bg-white overflow-hidden">
                            <CardHeader className="bg-[#0ea5e9] text-white p-6">
                                <CardTitle className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Expertise Required
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 text-[#1e3a8a] font-bold leading-relaxed whitespace-pre-wrap text-base">
                                {job.requirements}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
