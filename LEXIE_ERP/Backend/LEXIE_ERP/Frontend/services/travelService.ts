import { apiFetch } from "@/utils/api";

export interface TravelRequest {
    id: number;
    employee: number;
    employee_name: string;
    destination: string;
    start_date: string;
    end_date: string;
    purpose: string;
    estimated_cost: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    manager_comment?: string;
    approved_by?: number;
    approved_by_name?: string;
    created_at: string;
}

export const travelService = {
    getMyRequests: async (): Promise<TravelRequest[]> => {
        const response = await apiFetch("/hr/travel-requests/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    createRequest: async (data: { destination: string; start_date: string; end_date: string; purpose: string; estimated_cost: number }) => {
        return await apiFetch("/hr/travel-requests/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Manager actions
    getAllRequests: async (): Promise<TravelRequest[]> => {
        const response = await apiFetch("/hr/travel-requests/"); // Backend permissions handle visibility
        return Array.isArray(response) ? response : (response.results || []);
    },

    approveRequest: async (id: number, comment?: string) => {
        return await apiFetch(`/hr/travel-requests/${id}/approve/`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },

    rejectRequest: async (id: number, comment?: string) => {
        return await apiFetch(`/hr/travel-requests/${id}/reject/`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },
};
