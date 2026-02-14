import { apiFetch } from "@/utils/api";

export interface BankStatement {
    id?: number;
    account: number;
    account_name?: string;
    statement_date: string;
    reference: string;
    start_balance: number | string;
    end_balance: number | string;
    status: 'DRAFT' | 'POSTED';
    lines?: BankStatementLine[];
    created_at?: string;
}

export interface BankStatementLine {
    id?: number;
    statement: number;
    date: string;
    description: string;
    amount: number | string;
    reference?: string;
    is_reconciled: boolean;
    matched_journal_entry?: number; // ID of the matched JE
}

export const bankService = {
    // Statements
    getStatements: async (): Promise<BankStatement[]> => {
        const response = await apiFetch("/finance/bank-statements/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getStatement: async (id: number): Promise<BankStatement> => {
        return await apiFetch(`/finance/bank-statements/${id}/`);
    },

    createStatement: async (data: BankStatement): Promise<BankStatement> => {
        return await apiFetch("/finance/bank-statements/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateStatement: async (id: number, data: Partial<BankStatement>): Promise<BankStatement> => {
        return await apiFetch(`/finance/bank-statements/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Lines
    createLine: async (data: BankStatementLine): Promise<BankStatementLine> => {
        return await apiFetch("/finance/bank-statement-lines/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    deleteLine: async (id: number): Promise<void> => {
        return await apiFetch(`/finance/bank-statement-lines/${id}/`, {
            method: "DELETE",
        });
    },

    // Reconciliation
    matchLine: async (lineId: number, journalEntryId: number): Promise<void> => {
        return await apiFetch(`/finance/bank-statement-lines/${lineId}/match/`, {
            method: "POST",
            body: JSON.stringify({ journal_entry_id: journalEntryId }),
        });
    },

    unmatchLine: async (lineId: number): Promise<void> => {
        return await apiFetch(`/finance/bank-statement-lines/${lineId}/unmatch/`, {
            method: "POST",
        });
    },
};
