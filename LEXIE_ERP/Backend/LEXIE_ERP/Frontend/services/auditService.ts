import { apiFetch } from "@/utils/api";

export interface RegulatoryRequirement {
    id?: number;
    name: string;
    description: string;
    authority: string;
    due_date?: string;
    status: 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT';
    created_at?: string;
}

export interface InternalControl {
    id?: number;
    name: string;
    description: string;
    control_type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'AD_HOC';
    owner?: number;
    owner_name?: string;
    created_at?: string;
}

export interface ControlTest {
    id?: number;
    control: number;
    control_name?: string;
    test_date: string;
    tester?: number;
    tester_name?: string;
    result: 'PASS' | 'FAIL' | 'PARTIAL';
    evidence?: string;
    notes?: string;
    created_at?: string;
}

export const auditService = {
    // Regulatory Requirements
    getRequirements: async (): Promise<RegulatoryRequirement[]> => {
        const response = await apiFetch("/audit/regulatory-requirements/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    createRequirement: async (data: RegulatoryRequirement): Promise<RegulatoryRequirement> => {
        return await apiFetch("/audit/regulatory-requirements/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateRequirement: async (id: number, data: Partial<RegulatoryRequirement>): Promise<RegulatoryRequirement> => {
        return await apiFetch(`/audit/regulatory-requirements/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Internal Controls
    getControls: async (): Promise<InternalControl[]> => {
        const response = await apiFetch("/audit/internal-controls/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    createControl: async (data: InternalControl): Promise<InternalControl> => {
        return await apiFetch("/audit/internal-controls/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Control Tests
    getControlTests: async (controlId?: number): Promise<ControlTest[]> => {
        const url = controlId ? `/audit/control-tests/?control=${controlId}` : "/audit/control-tests/";
        const response = await apiFetch(url);
        return Array.isArray(response) ? response : (response.results || []);
    },

    createControlTest: async (data: ControlTest): Promise<ControlTest> => {
        return await apiFetch("/audit/control-tests/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
};
