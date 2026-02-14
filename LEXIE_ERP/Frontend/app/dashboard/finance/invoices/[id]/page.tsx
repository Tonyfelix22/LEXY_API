import InvoiceDetailClient from "@/components/finance/InvoiceDetailClient";

// Static export: always return one path so build succeeds without API. Client fetches by id at runtime.
export function generateStaticParams() {
    return [{ id: "_" }];
}

export default function InvoiceDetailPage() {
    return <InvoiceDetailClient />;
}
