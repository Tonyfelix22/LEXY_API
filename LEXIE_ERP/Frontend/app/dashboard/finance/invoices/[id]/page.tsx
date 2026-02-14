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
        console.warn("Could not generate static params for invoices (backend might be down). Falling back to placeholder.");
        return [{ id: "_" }];
    }
}

export default function InvoiceDetailPage() {
    return <InvoiceDetailClient />;
}
