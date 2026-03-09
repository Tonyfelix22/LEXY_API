import InvoiceDetailClient from "@/components/finance/InvoiceDetailClient";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
    return [{ id: "_" }];
}

export default function InvoiceDetailPage() {
    return <InvoiceDetailClient />;
}
