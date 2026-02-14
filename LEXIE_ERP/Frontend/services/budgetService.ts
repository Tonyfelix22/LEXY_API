import { apiFetch } from "@/utils/api";

export interface Budget {
    id: number;
    name: string;
    department: number;
    department_name: string;
    amount: string;
    spent_amount: string;
    remaining_amount: string;
    utilization: number;
    start_date: string;
    end_date: string;
    description: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by?: number;
    is_active: boolean;
}

export const budgetService = {
    getAll: async (): Promise<Budget[]> => {
        const response = await apiFetch("/finance/budgets/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getById: async (id: number): Promise<Budget> => {
        return await apiFetch(`/finance/budgets/${id}/`);
    },

    create: async (data: Partial<Budget>) => {
        return await apiFetch("/finance/budgets/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    update: async (id: number, data: Partial<Budget>) => {
        return await apiFetch(`/finance/budgets/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    delete: async (id: number) => {
        return await apiFetch(`/finance/budgets/${id}/`, {
            method: "DELETE",
        });
    },

    approve: async (id: number) => {
        return await apiFetch(`/finance/budgets/${id}/approve/`, {
            method: "POST",
        });
    },

    reject: async (id: number) => {
        return await apiFetch(`/finance/budgets/${id}/reject/`, {
            method: "POST",
        });
    },
};
