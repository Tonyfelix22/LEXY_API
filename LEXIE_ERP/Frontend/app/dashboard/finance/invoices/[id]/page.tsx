import { apiFetch } from "@/utils/api";
import InvoiceDetailClient from "@/components/finance/InvoiceDetailClient";

const FALLBACK_PARAMS = [{ id: "_" }];

export async function generateStaticParams() {
    try {
        const invoices = await apiFetch("/finance/invoices/");
        if (Array.isArray(invoices) && invoices.length > 0) {
            return invoices.map((inv: any) => ({ id: inv.id.toString() }));
        }
        if (invoices?.results && Array.isArray(invoices.results) && invoices.results.length > 0) {
            return invoices.results.map((inv: any) => ({ id: inv.id.toString() }));
        }
        return FALLBACK_PARAMS;
    } catch {
        return FALLBACK_PARAMS;
    }
}

export default function InvoiceDetailPage() {
    return <InvoiceDetailClient />;
}
