import { apiFetch } from "@/utils/api";

export interface JobPosting {
    id?: number;
    title: string;
    department: number;
    department_name?: string;
    job_description: string;
    requirements: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
    closing_date?: string;
    applicant_count?: number;
    created_at?: string;
}

export interface Applicant {
    id?: number;
    job_posting: number;
    job_title?: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
    phone?: string;
    resume_link?: string;
    cover_letter?: string;
    status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER_SENT' | 'HIRED' | 'REJECTED';
    notes?: string;
    created_at?: string;
}

export const recruitmentService = {
    // Jobs
    getJobs: async (): Promise<JobPosting[]> => {
        const response = await apiFetch("/hr/job-postings/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getJob: async (id: number): Promise<JobPosting> => {
        return await apiFetch(`/hr/job-postings/${id}/`);
    },

    createJob: async (data: JobPosting): Promise<JobPosting> => {
        return await apiFetch("/hr/job-postings/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateJob: async (id: number, data: Partial<JobPosting>): Promise<JobPosting> => {
        return await apiFetch(`/hr/job-postings/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Applicants
    getApplicants: async (jobId?: number): Promise<Applicant[]> => {
        const url = jobId ? `/hr/applicants/?job_posting=${jobId}` : "/hr/applicants/";
        const response = await apiFetch(url);
        return Array.isArray(response) ? response : (response.results || []);
    },

    createApplicant: async (data: Partial<Applicant>): Promise<Applicant> => {
        return await apiFetch("/hr/applicants/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateApplicantStatus: async (id: number, status: string, notes?: string): Promise<Applicant> => {
        return await apiFetch(`/hr/applicants/${id}/change_status/`, {
            method: "POST",
            body: JSON.stringify({ status, notes }),
        });
    },
};
