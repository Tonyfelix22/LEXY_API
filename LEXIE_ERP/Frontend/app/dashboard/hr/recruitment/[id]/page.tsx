import JobDetailsClient from "@/components/hr/JobDetailsClient";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
    return [{ id: "_" }];
}

export default function JobDetailsPage() {
    return <JobDetailsClient />;
}
