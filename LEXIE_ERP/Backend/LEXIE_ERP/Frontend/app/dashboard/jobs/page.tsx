'use client'

import { useState, useEffect } from 'react'
import { recruitmentService, JobPosting, Applicant } from '@/services/recruitmentService'
import { apiFetch } from '@/utils/api'
import { Briefcase, MapPin, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JobsPage() {
    const [activeTab, setActiveTab] = useState<'OPEN' | 'MY_APPS'>('OPEN')
    const [jobs, setJobs] = useState<JobPosting[]>([])
    const [applications, setApplications] = useState<Applicant[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Simple Apply Modal State
    const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null)
    const [applyForm, setApplyForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        resume_link: '',
        cover_letter: ''
    })

    // Fetch current user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await apiFetch('/users/user/')
                setCurrentUser(userData)

                // Pre-fill form with user data
                setApplyForm(prev => ({
                    ...prev,
                    first_name: userData.employee?.first_name || userData.first_name || '',
                    last_name: userData.employee?.last_name || userData.last_name || '',
                    email: userData.employee?.email || userData.email || '',
                }))
            } catch (error) {
                console.error('Failed to fetch user data:', error)
                toast.error('Failed to load user information')
            }
        }
        fetchUserData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jobsData, appsData] = await Promise.all([
                recruitmentService.getJobs(), // TODO: Filter by status=OPEN
                recruitmentService.getApplicants() // My apps
            ])
            // Filter OPEN jobs only for the board
            setJobs(jobsData.filter((j: any) => j.status === 'OPEN'))
            setApplications(appsData)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleApplyClick = (job: JobPosting) => {
        setApplyingJob(job)
        // Reset only the editable fields
        setApplyForm(prev => ({
            ...prev,
            resume_link: '',
            cover_letter: ''
        }))
    }

    const submitApplication = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!applyingJob) return

        // Check if user has employee profile
        if (!currentUser?.employee) {
            toast.error('You must have an employee profile to apply for internal jobs. Please contact HR.')
            return
        }

        try {
            // Only send editable fields - backend will auto-populate personal info
            await recruitmentService.createApplicant({
                job_posting: applyingJob.id!,
                resume_link: applyForm.resume_link,
                cover_letter: applyForm.cover_letter,
                // first_name, last_name, email will be set by backend from employee profile
            })
            toast.success('Application submitted successfully!')
            setApplyingJob(null)
            fetchData() // Refresh list
        } catch (error) {
            console.error(error)
            toast.error('Failed to submit application')
        }
    }

    return (
        <div className="p-8 space-y-8 bg-slate-900 min-h-screen text-white">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">Internal Requisitions</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b-4 border-slate-800">
                <button
                    onClick={() => setActiveTab('OPEN')}
                    className={`pb-4 px-2 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'OPEN'
                        ? 'text-sky-400 border-b-4 border-sky-400 -mb-[4px]'
                        : 'text-slate-400 hover:text-sky-400'
                        }`}
                >
                    Open Opportunities
                </button>
                <button
                    onClick={() => setActiveTab('MY_APPS')}
                    className={`pb-4 px-2 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'MY_APPS'
                        ? 'text-sky-400 border-b-4 border-sky-400 -mb-[4px]'
                        : 'text-slate-400 hover:text-sky-400'
                        }`}
                >
                    My History
                </button>
            </div>

            {loading ? (
                <div className="py-24 text-center text-sky-400 font-black uppercase tracking-widest animate-pulse">Synchronizing...</div>
            ) : (
                <div className="grid gap-8">
                    {activeTab === 'OPEN' && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {jobs.length === 0 ? (
                                <p className="col-span-full text-center text-slate-400 py-24 font-black uppercase tracking-[0.2em] border-4 border-dotted border-slate-800 rounded-[3rem]">No active vacancies found.</p>
                            ) : (
                                jobs.map(job => (
                                    <div key={job.id} className="bg-slate-800 p-8 rounded-[2rem] border-2 border-slate-700 hover:border-sky-500 hover:shadow-2xl transition-all duration-500 group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-extrabold text-2xl text-white group-hover:text-sky-400 transition-colors">{job.title}</h3>
                                                <p className="text-xs text-sky-400 font-black uppercase tracking-widest mt-1">{job.department_name}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                                                Active
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center text-xs text-slate-400 font-bold uppercase tracking-tight gap-2">
                                                <Briefcase className="w-4 h-4 text-sky-400" />
                                                <span>Permanent Role</span>
                                            </div>
                                            {job.closing_date && (
                                                <div className="flex items-center text-xs text-slate-400 font-bold uppercase tracking-tight gap-2">
                                                    <Clock className="w-4 h-4 text-sky-400" />
                                                    <span>Submission Deadline: <span className="text-white font-black ml-1">{job.closing_date}</span></span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-400 mb-8 line-clamp-3 font-medium leading-relaxed">
                                            {job.job_description}
                                        </p>

                                        <button
                                            onClick={() => handleApplyClick(job)}
                                            className="w-full py-4 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all duration-300 text-xs font-black uppercase tracking-[0.2em] shadow-lg"
                                        >
                                            Submit Application
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'MY_APPS' && (
                        <div className="bg-slate-800 rounded-[2rem] border-2 border-slate-700 overflow-hidden shadow-2xl">
                            <table className="min-w-full divide-y-4 divide-slate-900">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Designation</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Application Date</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Current Stage</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Internal Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {applications.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-black uppercase tracking-widest">
                                                No submission history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        applications.map(app => (
                                            <tr key={app.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-white uppercase tracking-tight">
                                                    {app.job_title}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                    {app.created_at?.split('T')[0]}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className="px-4 py-1.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm">
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs text-slate-400 font-bold max-w-xs truncate italic">
                                                    {app.notes || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Apply Modal */}
            {applyingJob && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-xl border-4 border-slate-700">
                        <div className="p-10 border-b-4 border-slate-700 bg-slate-900/50">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Internal Requisition</h2>
                            <p className="text-sky-400 font-black text-xs uppercase tracking-[0.3em] mt-2">{applyingJob.title}</p>
                        </div>
                        <form onSubmit={submitApplication} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 border-2 border-slate-700 rounded-2xl bg-slate-900/50 font-bold text-slate-400 cursor-not-allowed outline-none"
                                        value={applyForm.first_name}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 border-2 border-slate-700 rounded-2xl bg-slate-900/50 font-bold text-slate-400 cursor-not-allowed outline-none"
                                        value={applyForm.last_name}
                                        readOnly
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">Email Terminal</label>
                                <input
                                    type="email"
                                    className="w-full p-4 border-2 border-slate-700 rounded-2xl bg-slate-900/50 font-bold text-slate-400 cursor-not-allowed outline-none"
                                    value={applyForm.email}
                                    readOnly
                                    disabled
                                />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2 ml-1">Identity verified via employee profile record</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">Portfolio/Resume URL</label>
                                <input
                                    type="url"
                                    className="w-full p-4 border-2 border-slate-700 rounded-2xl bg-slate-900 font-bold text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-500"
                                    placeholder="https://cloud.storage/resume.pdf"
                                    required
                                    value={applyForm.resume_link}
                                    onChange={e => setApplyForm({ ...applyForm, resume_link: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">Statement of Interest</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-6 border-2 border-slate-700 rounded-2xl bg-slate-900 font-bold text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-500"
                                    placeholder="Briefly explain your motivation for this internal move..."
                                    required
                                    value={applyForm.cover_letter}
                                    onChange={e => setApplyForm({ ...applyForm, cover_letter: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setApplyingJob(null)}
                                    className="px-8 py-3 text-red-300 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-3 bg-sky-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-sky-600 transition-all shadow-xl"
                                >
                                    Commit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
