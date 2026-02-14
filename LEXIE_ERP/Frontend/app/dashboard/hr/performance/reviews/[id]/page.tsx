import { apiFetch } from "@/utils/api";
import ReviewDetailsClient from "@/components/hr/ReviewDetailsClient";

export async function generateStaticParams() {
    try {
        const reviews = await apiFetch("/hr/performance-reviews/");
        if (Array.isArray(reviews)) {
            return reviews.map((review: any) => ({
                id: review.id.toString(),
            }));
        } else if (reviews && reviews.results && Array.isArray(reviews.results)) {
            return reviews.results.map((review: any) => ({
                id: review.id.toString(),
            }));
        }
        return [];
    } catch (error) {
        console.warn("Could not generate static params for reviews (backend might be down during build). Falling back to placeholder.");
        return [{ id: "_" }];
    }
}

export default function ReviewDetailsPage() {
    return <ReviewDetailsClient />;
}
