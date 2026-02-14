/**
 * Runtime API base URL. Uses /config.json (written at build from NEXT_PUBLIC_BASE_API)
 * so the deployed app always uses the correct URL even when env was not inlined.
 */
const DEFAULT_BASE = "http://127.0.0.1:8000/api";

let cachedBase: string | null = null;
let configPromise: Promise<string> | null = null;

export function getBaseUrl(): Promise<string> {
    if (typeof window === "undefined") {
        const env =
            (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_API) ||
            (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
            DEFAULT_BASE;
        return Promise.resolve(env);
    }
    if (cachedBase) return Promise.resolve(cachedBase);
    if (configPromise) return configPromise;

    configPromise = fetch("/config.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { baseApi?: string } | null) => {
            const base = data?.baseApi?.trim();
            if (base) {
                // Don't add /api if it already ends with /api
                cachedBase = base.endsWith("/api") ? base : base.replace(/\/?$/, "") + "/api";
                return cachedBase;
            }
            cachedBase =
                (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_API) ||
                (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
                DEFAULT_BASE;
            return cachedBase;
        })
        .catch(() => {
            cachedBase =
                (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_API) ||
                (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
                DEFAULT_BASE;
            return cachedBase;
        });

    return configPromise;
}
