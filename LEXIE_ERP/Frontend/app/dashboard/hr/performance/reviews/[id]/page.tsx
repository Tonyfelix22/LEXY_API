import ReviewDetailsClient from "@/components/hr/ReviewDetailsClient";

// Static export: always return one path so build succeeds without API. Client fetches by id at runtime.
export function generateStaticParams() {
    return [{ id: "_" }];
}

export default function ReviewDetailsPage() {
    return <ReviewDetailsClient />;
}
