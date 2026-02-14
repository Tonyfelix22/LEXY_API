import { getAuthToken } from "@/utils/token";
import { getBaseUrl } from "@/utils/config";

const DEFAULT_BASE = "http://127.0.0.1:8000/api";

/** Sync fallback for build-time / non-browser (e.g. generateStaticParams). */
export const BASE_URL =
    typeof process !== "undefined"
        ? (process.env.NEXT_PUBLIC_BASE_API || process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE)
        : DEFAULT_BASE;

/** Backend root for media/file URLs. Use getBackendRoot() when in browser for runtime config. */
export const BACKEND_ROOT = BASE_URL.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000";

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const base = await getBaseUrl();
    let url: string;
    
    if (endpoint.startsWith("http")) {
        url = endpoint;
    } else {
        // Remove trailing slash from base and leading slash from endpoint to avoid double slashes
        const cleanBase = base.replace(/\/?$/, "");
        const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
        url = `${cleanBase}/${cleanEndpoint}`;
    }

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
