/**
 * Runtime API base URL. Uses /config.json (written at build from NEXT_PUBLIC_BASE_API)
 * so the deployed app always uses the correct URL even when env was not inlined.
 */
const DEFAULT_BASE = "http://127.0.0.1:8000/api";

let cachedBase: string | null = null;
let configPromise: Promise<string> | null = null;

export function getBaseUrl(): Promise<string> {
    if (typeof window === "undefined") {
        const envBase =
            (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_API) ||
            (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
            DEFAULT_BASE;
        // Apply same cleaning logic server-side
        const cleanBase = envBase.replace(/\/+$/, "");
        const finalBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
        return Promise.resolve(finalBase);
    }
    if (cachedBase) return Promise.resolve(cachedBase);
    if (configPromise) return configPromise;

    configPromise = fetch("/config.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { baseApi?: string } | null) => {
            const base = data?.baseApi?.trim();
            if (base) {
                // Remove trailing slash and ensure it ends with /api
                const cleanBase = base.replace(/\/+$/, "");
                cachedBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
                return cachedBase;
            }
            cachedBase =
                (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_API) ||
                (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
                DEFAULT_BASE;
            return cachedBase;
        })
        .catch(() => {
            const fallbackBase = 
                (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_API) ||
                (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
                DEFAULT_BASE;
            // Apply same cleaning logic to fallback
            const cleanBase = fallbackBase.replace(/\/+$/, "");
            cachedBase = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
            return cachedBase;
        });

    return configPromise;
}
