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
        // Remove leading slash from endpoint if base already has trailing/specified handling
        const cleanBase = base.replace(/\/+$/, "");
        const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
        url = `${cleanBase}/${cleanEndpoint}`;

        // Normalize the path part ONLY (after the protocol)
        const protocolMatch = url.match(/^(https?:\/\/)/);
        if (protocolMatch) {
            const protocol = protocolMatch[1];
            const pathPart = url.substring(protocol.length);
            url = protocol + pathPart.replace(/\/+/g, "/");
        } else {
            url = url.replace(/\/+/g, "/");
        }
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
            let errorMessage = text;
            try {
                const json = JSON.parse(text);
                if (typeof json === 'object' && json !== null) {
                    const messages = Object.entries(json).map(([key, value]) => {
                        const valStr = Array.isArray(value) ? value[0] : value;
                        return key === 'detail' || key === 'non_field_errors' || key === 'error' 
                            ? valStr 
                            : `${key.replace(/_/g, ' ')}: ${valStr}`;
                    });
                    if (messages.length > 0) {
                        errorMessage = messages.join(' | ');
                    }
                }
            } catch (e) {
                errorMessage = `API error ${response.status}: ${text}`;
            }
            throw new Error(errorMessage);
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
