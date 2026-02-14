import { apiFetch } from "@/utils/api";
import ReconciliationClient from "@/components/finance/ReconciliationClient";

export async function generateStaticParams() {
    try {
        const statements = await apiFetch("/finance/bank-statements/");
        if (Array.isArray(statements)) {
            return statements.map((stmt: any) => ({
                id: stmt.id.toString(),
            }));
        } else if (statements && statements.results && Array.isArray(statements.results)) {
            return statements.results.map((stmt: any) => ({
                id: stmt.id.toString(),
            }));
        }
        return [];
    } catch (error) {
        console.warn("Could not generate static params for statements (backend might be down). Falling back to placeholder.");
        return [{ id: "_" }];
    }
}

export default function ReconciliationPage() {
    return <ReconciliationClient />;
}
