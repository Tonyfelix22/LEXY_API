"use client";

import { useState, useEffect } from "react";
import { recruitmentService, JobPosting } from "@/services/recruitmentService";
import { Button } from "@/components/ui/button";
import { Plus, Users, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

export default function JobBoardPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const data = await recruitmentService.getJobs();
            setJobs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-green-900/30 text-green-400 border border-green-900/50";
            case "CLOSED": return "bg-slate-700/50 text-slate-400 border border-slate-700";
            default: return "bg-slate-800 text-slate-400";
        }
    };

    return (
        <div className="space-y-8 bg-slate-900 min-h-screen p-8 rounded-3xl border border-slate-800">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Recruitment Management</h1>
                    <p className="text-slate-400 font-medium">Create and manage job postings, track applicants and hiring progress</p>
                </div>
                <Link href="/dashboard/hr/recruitment/create">
                    <Button className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-all duration-300 rounded-xl px-6 py-6 h-auto font-bold uppercase tracking-widest">
                        <Plus className="mr-2 h-5 w-5" /> Post New Job
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.map((job) => (
                    <Link href={`/dashboard/hr/recruitment/${job.id}`} key={job.id} className="group">
                        <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-slate-800 group-hover:border-sky-500/50 rounded-2xl overflow-hidden bg-slate-800">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <Badge className={`${getStatusColor(job.status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                                        {job.status}
                                    </Badge>
                                    <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-tighter">
                                        <Calendar className="mr-1 h-3 w-3 text-sky-400" />
                                        {format(new Date(job.created_at!), "MMM d, yyyy")}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">{job.title}</CardTitle>
                                <CardDescription className="text-sky-400 font-black text-sm tracking-widest uppercase">{job.department_name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 group-hover:border-sky-500/30 transition-colors">
                                        <div className="flex items-center text-slate-400 font-black uppercase text-xs tracking-widest">
                                            <Users className="mr-2 h-4 w-4 text-sky-400" />
                                            <span>Applicants</span>
                                        </div>
                                        <span className="text-xl font-black text-white">{job.applicant_count || 0}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-400 font-bold uppercase tracking-tight">
                                        <Briefcase className="mr-2 h-4 w-4 text-sky-400" />
                                        {job.closing_date ? (
                                            <span>Closing: <span className="text-white font-black">{format(new Date(job.closing_date), "MMM d, yyyy")}</span></span>
                                        ) : (
                                            <span className="italic">Ongoing</span>
                                        )}
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <span className="text-sky-400 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform flex items-center">
                                            Manage Job &rarr;
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {jobs.length === 0 && !loading && (
                <div className="text-center py-24 bg-slate-800 rounded-3xl border-4 border-dashed border-slate-700">
                    <div className="bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
                        <Briefcase className="w-8 h-8 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No active job postings</h3>
                    <p className="text-slate-400 max-w-xs mx-auto mb-8 font-bold">Create your first job posting to start receiving applications.</p>
                    <Link href="/dashboard/hr/recruitment/create">
                        <Button className="bg-sky-500 hover:bg-sky-600 text-white font-black uppercase tracking-widest px-8 py-6 h-auto rounded-xl shadow-lg">
                            <Plus className="mr-2 h-5 w-5" /> Start Recruitment
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
