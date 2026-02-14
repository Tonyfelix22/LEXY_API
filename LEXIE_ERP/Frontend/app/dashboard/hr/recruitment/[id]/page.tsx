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
        console.warn("Could not generate static params for recruitment (backend might be down). Falling back to placeholder.");
        return [{ id: "_" }];
    }
}

export default function JobDetailsPage() {
    return <JobDetailsClient />;
}
