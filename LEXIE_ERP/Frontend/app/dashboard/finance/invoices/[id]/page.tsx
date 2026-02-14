import { apiFetch } from "@/utils/api";
import InvoiceDetailClient from "@/components/finance/InvoiceDetailClient";

export async function generateStaticParams() {
    try {
        const invoices = await apiFetch("/finance/invoices/");
        if (Array.isArray(invoices)) {
            return invoices.map((inv: any) => ({
                id: inv.id.toString(),
            }));
        } else if (invoices && invoices.results && Array.isArray(invoices.results)) {
            return invoices.results.map((inv: any) => ({
                id: inv.id.toString(),
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to generate static params for invoices:", error);
        return [{ id: '1' }];
    }
}

export default function InvoiceDetailPage() {
    return <InvoiceDetailClient />;
}
