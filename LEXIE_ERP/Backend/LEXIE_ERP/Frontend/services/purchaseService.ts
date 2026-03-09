import { apiFetch } from "@/utils/api";

export interface PurchaseRequest {
    id: number;
    requester: number;
    requester_name: string;
    department: number;
    department_name: string;
    description: string;
    estimated_cost: string;
    vendor_suggestion?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ORDERED';
    approved_by?: number;
    approved_by_name?: string;
    rejection_reason?: string;
    budget?: number;
    budget_name?: string;
    created_at: string;
}

export const purchaseService = {
    getAll: async (): Promise<PurchaseRequest[]> => {
        // Backend automatically filters based on user role:
        // - Finance/Super Admin: All requests
        // - Department Manager: Department requests
        // - Regular Employee: Own requests only
        const response = await apiFetch("/finance/purchase-requests/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getMyRequests: async (): Promise<PurchaseRequest[]> => {
        // Alias for getAll - backend handles filtering automatically
        const response = await apiFetch("/finance/purchase-requests/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    create: async (data: Partial<PurchaseRequest>) => {
        return await apiFetch("/finance/purchase-requests/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    approve: async (id: number) => {
        return await apiFetch(`/finance/purchase-requests/${id}/approve/`, {
            method: "POST",
        });
    },

    reject: async (id: number, reason: string) => {
        return await apiFetch(`/finance/purchase-requests/${id}/reject/`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
    },
};
