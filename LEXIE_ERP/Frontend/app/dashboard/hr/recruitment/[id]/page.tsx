import { apiFetch } from "@/utils/api";
import JobDetailsClient from "@/components/hr/JobDetailsClient";

const FALLBACK_PARAMS = [{ id: "_" }];

export async function generateStaticParams() {
    try {
        const jobs = await apiFetch("/hr/job-postings/");
        if (Array.isArray(jobs) && jobs.length > 0) {
            return jobs.map((job: any) => ({ id: job.id.toString() }));
        }
        if (jobs?.results && Array.isArray(jobs.results) && jobs.results.length > 0) {
            return jobs.results.map((job: any) => ({ id: job.id.toString() }));
        }
        return FALLBACK_PARAMS;
    } catch {
        return FALLBACK_PARAMS;
    }
}

export default function JobDetailsPage() {
    return <JobDetailsClient />;
}
