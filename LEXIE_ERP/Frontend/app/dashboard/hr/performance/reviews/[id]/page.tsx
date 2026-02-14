import { apiFetch } from "@/utils/api";
import ReviewDetailsClient from "@/components/hr/ReviewDetailsClient";

const FALLBACK_PARAMS = [{ id: "_" }];

export async function generateStaticParams() {
    try {
        const reviews = await apiFetch("/hr/performance-reviews/");
        if (Array.isArray(reviews) && reviews.length > 0) {
            return reviews.map((review: any) => ({ id: review.id.toString() }));
        }
        if (reviews?.results && Array.isArray(reviews.results) && reviews.results.length > 0) {
            return reviews.results.map((review: any) => ({ id: review.id.toString() }));
        }
        return FALLBACK_PARAMS;
    } catch {
        return FALLBACK_PARAMS;
    }
}

export default function ReviewDetailsPage() {
    return <ReviewDetailsClient />;
}
