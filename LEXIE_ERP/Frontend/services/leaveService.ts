import { apiFetch } from "@/utils/api";

export interface LeaveType {
    id: number;
    name: string;
    code: string;
    days_per_year: number;
    requires_approval: boolean;
    description: string;
}

export interface LeaveBalance {
    id: number;
    employee: number;
    employee_name: string;
    leave_type: number;
    leave_type_name: string;
    leave_type_code: string;
    year: number;
    balance: string;
    used: string;
}

export interface LeaveRequest {
    id: number;
    employee: number;
    employee_name: string;
    employee_user_id: number;
    leave_type: number;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    duration: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    manager_comment?: string;
    approved_by?: number;
    approved_by_name?: string;
    created_at: string;
}

export const leaveService = {
    getLeaveTypes: async (): Promise<LeaveType[]> => {
        const response = await apiFetch("/hr/leave-types/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getMyBalances: async (): Promise<LeaveBalance[]> => {
        const response = await apiFetch("/hr/leave-balances/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getMyRequests: async (): Promise<LeaveRequest[]> => {
        const response = await apiFetch("/hr/leave-requests/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    applyForLeave: async (data: { employee?: number; leave_type: number; start_date: string; end_date: string; reason: string }) => {
        return await apiFetch("/hr/leave-requests/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Manager actions
    getAllRequests: async (): Promise<LeaveRequest[]> => {
        const response = await apiFetch("/hr/leave-requests/"); // Backend filters based on role
        return Array.isArray(response) ? response : (response.results || []);
    },

    approveRequest: async (id: number, comment?: string) => {
        return await apiFetch(`/hr/leave-requests/${id}/approve/`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },

    rejectRequest: async (id: number, comment?: string) => {
        return await apiFetch(`/hr/leave-requests/${id}/reject/`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },
};
