import { apiFetch } from "@/utils/api";
import JobDetailsClient from "@/components/hr/JobDetailsClient";

export async function generateStaticParams() {
    try {
        const jobs = await apiFetch("/hr/job-postings/");
        if (Array.isArray(jobs)) {
            return jobs.map((job: any) => ({
                id: job.id.toString(),
            }));
        } else if (jobs && jobs.results && Array.isArray(jobs.results)) {
            return jobs.results.map((job: any) => ({
                id: job.id.toString(),
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to generate static params for recruitment:", error);
        // Fallback for build time if backend is not reachable
        return [{ id: '1' }];
    }
}

export default function JobDetailsPage() {
    return <JobDetailsClient />;
}
