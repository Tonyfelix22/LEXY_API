import { apiFetch } from "@/utils/api";

export interface PerformanceGoal {
    id?: number;
    employee: number;
    employee_name?: string;
    title: string;
    description?: string;
    due_date?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    progress: number;
    created_at?: string;
}

export interface PerformanceReview {
    id?: number;
    employee: number;
    employee_name?: string;
    reviewer?: number;
    reviewer_name?: string;
    review_period_start: string;
    review_period_end: string;
    review_date?: string;
    status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED';
    rating?: number;
    feedback?: string;
    created_at?: string;
}

export const performanceService = {
    // Goals
    getGoals: async (employeeId?: number): Promise<PerformanceGoal[]> => {
        const url = employeeId ? `/hr/performance-goals/?employee=${employeeId}` : "/hr/performance-goals/";
        const response = await apiFetch(url);
        return Array.isArray(response) ? response : (response.results || []);
    },

    createGoal: async (data: PerformanceGoal): Promise<PerformanceGoal> => {
        return await apiFetch("/hr/performance-goals/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateGoal: async (id: number, data: Partial<PerformanceGoal>): Promise<PerformanceGoal> => {
        return await apiFetch(`/hr/performance-goals/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    deleteGoal: async (id: number): Promise<void> => {
        return await apiFetch(`/hr/performance-goals/${id}/`, {
            method: "DELETE",
        });
    },

    // Reviews
    getReviews: async (employeeId?: number): Promise<PerformanceReview[]> => {
        const url = employeeId ? `/hr/performance-reviews/?employee=${employeeId}` : "/hr/performance-reviews/";
        const response = await apiFetch(url);
        return Array.isArray(response) ? response : (response.results || []);
    },

    getReview: async (id: number): Promise<PerformanceReview> => {
        return await apiFetch(`/hr/performance-reviews/${id}/`);
    },

    createReview: async (data: PerformanceReview): Promise<PerformanceReview> => {
        return await apiFetch("/hr/performance-reviews/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateReview: async (id: number, data: Partial<PerformanceReview>): Promise<PerformanceReview> => {
        return await apiFetch(`/hr/performance-reviews/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
};
