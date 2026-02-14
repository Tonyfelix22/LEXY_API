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
        console.error("Failed to generate static params for statements:", error);
        return [{ id: '1' }];
    }
}

export default function ReconciliationPage() {
    return <ReconciliationClient />;
}
