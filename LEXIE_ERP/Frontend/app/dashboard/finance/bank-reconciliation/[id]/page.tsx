import ReconciliationClient from "@/components/finance/ReconciliationClient";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
    return [{ id: "_" }];
}

export default function ReconciliationPage() {
    return <ReconciliationClient />;
}
