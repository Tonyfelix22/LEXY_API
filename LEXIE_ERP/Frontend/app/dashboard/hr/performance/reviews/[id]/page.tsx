import ReviewDetailsClient from "@/components/hr/ReviewDetailsClient";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
    return [{ id: "_" }];
}

export default function ReviewDetailsPage() {
    return <ReviewDetailsClient />;
}
