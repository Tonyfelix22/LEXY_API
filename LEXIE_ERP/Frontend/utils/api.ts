import { getAuthToken } from "@/utils/token";

const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_API || "http://127.0.0.1:8000/api";

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const url = endpoint.startsWith("http")
        ? endpoint
        : `${BASE_URL}${endpoint}`;

    const token = getAuthToken();

    const defaultHeaders: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) {
        // Use Token scheme for DRF TokenAuth (what login returns)
        // Backend supports both Token and Bearer authentication
        defaultHeaders["Authorization"] = `Token ${token}`;
    }

    try {
        const response = await fetch(url, {
            credentials: "include",
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API error ${response.status}: ${text}`);
        }

        try {
            return await response.json();
        } catch {
            return {};
        }
    } catch (error: any) {
        console.error("API Fetch Error:", error);
        if (error.message === "Failed to fetch") {
            throw new Error("Unable to connect to the server. Is the backend running?");
        }
        throw error;
    }
}

export async function fetchReportTypes() {
    return apiFetch("/reports/types/");
}

export async function generateReport(reportName: string, parameters: any, format: string = "JSON") {
    return apiFetch("/reports/generate/", {
        method: "POST",
        body: JSON.stringify({
            report_name: reportName,
            parameters: parameters,
            format: format
        })
    });
}

export const api = {
    get: (endpoint: string, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any = {}, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any = {}, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
