import { apiFetch } from "@/utils/api";
import ReconciliationClient from "@/components/finance/ReconciliationClient";

const FALLBACK_PARAMS = [{ id: "_" }];

export async function generateStaticParams() {
    try {
        const statements = await apiFetch("/finance/bank-statements/");
        if (Array.isArray(statements) && statements.length > 0) {
            return statements.map((stmt: any) => ({ id: stmt.id.toString() }));
        }
        if (statements?.results && Array.isArray(statements.results) && statements.results.length > 0) {
            return statements.results.map((stmt: any) => ({ id: stmt.id.toString() }));
        }
        return FALLBACK_PARAMS;
    } catch {
        return FALLBACK_PARAMS;
    }
}

export default function ReconciliationPage() {
    return <ReconciliationClient />;
}
