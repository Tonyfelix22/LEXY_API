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
        console.error("Failed to generate static params for reviews:", error);
        return [{ id: '1' }];
    }
}

export default function ReviewDetailsPage() {
    return <ReviewDetailsClient />;
}
