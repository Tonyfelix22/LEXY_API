"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken, saveAuthToken, clearAuthToken } from "@/utils/token";

interface User {
    id: number;
    username: string;
    email: string;
    role?: string;
    department?: string;
    groups?: string[];
    has_profile?: boolean;
    is_superuser?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<User>;
    loginWithToken: (token: string) => Promise<User>;
    logout: () => Promise<void>;
    isHRAdmin: boolean;
    isFinanceAdmin: boolean;
    isAuditAdmin: boolean;
    isSuperAdmin: boolean;
    canManageAll: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
const devLog = (...args: unknown[]) => { if (isDev) console.log(...args); };
const devWarn = (...args: unknown[]) => { if (isDev) console.warn(...args); };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const RAW_BASE_API = process.env.NEXT_PUBLIC_BASE_API || "http://127.0.0.1:8000/api";

    const buildUrl = (base: string, path: string) => {
        const b = base.replace(/\/?$/, "");
        const p = path.startsWith("/") ? path : `/${path}`;
        return `${b}${p}`;
    };

    const BASE_API = RAW_BASE_API;
    if (typeof window !== "undefined") devLog("API base:", BASE_API);

    const safeJson = async (res: Response) => {
        try {
            return await res.json()
        } catch {
            try {
                const text = await res.text()
                return { raw: text }
            } catch {
                return { error: "unable to parse response" }
            }
        }
    }

    const fetchUser = async (authToken: string): Promise<User | null> => {
        const endpoint = buildUrl(BASE_API, "/users/user/");
        devLog("📡 Fetching user from:", endpoint);

        const tryFetch = async (scheme: "Bearer" | "Token") => {
            const res = await fetch(endpoint, {
                headers: {
                    Authorization: `${scheme} ${authToken}`,
                    "Content-Type": "application/json",
                },
            });
            return res;
        };

        try {
            // Try Token first (DRF TokenAuth - what /api/users/login/ returns)
            let res = await tryFetch("Token");
            if (res.status === 401) {
                devWarn("⚠️ 401 with 'Token' scheme, retrying with 'Bearer' (JWT)...");
                res = await tryFetch("Bearer");
            }

            if (!res.ok) {
                const payload = await safeJson(res)
                console.error("❌ Failed to fetch user:", res.status, payload)
                return null
            }

            const data: User = await res.json();
            devLog("✅ User fetched successfully:", data.username);
            setUser(data);
            return data
        } catch (error: any) {
            console.error("❌ Network error fetching user:", error?.message || error)
            console.error("Hints: Check API base URL, server availability, and CORS configuration.")
            return null
        }
    };

    useEffect(() => {
        let cancelled = false;
        const initAuth = async () => {
            try {
                const savedToken = getAuthToken();
                if (savedToken) {
                    devLog("🔹 Restoring session...");
                    setToken(savedToken);
                    const fetchedUser = await fetchUser(savedToken);
                    if (cancelled) return;
                    if (!fetchedUser) devLog("⚠️ Session restore failed (token may be expired)");
                    else devLog("✅ Session restored");
                } else {
                    devLog("ℹ️ No saved token");
                }
            } catch (error) {
                if (!cancelled) console.error("❌ Auth init error:", error);
                if (!cancelled) {
                    clearAuthToken();
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        initAuth();
        return () => { cancelled = true; };
    }, []);

    const login = async (username: string, password: string): Promise<User> => {
        setIsLoading(true);
        try {
            const endpoint = buildUrl(BASE_API, "/users/login/");
            devLog("🔑 Login attempt:", username, "→", endpoint);

            let res: Response
            try {
                res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                })
            } catch (networkError: any) {
                console.error("❌ Network error during login fetch:", networkError?.message || networkError)
                console.error("Hints: Verify NEXT_PUBLIC_BASE_API (", BASE_API, "), server is running, and CORS allows the origin.")
                throw new Error("Login request failed: unable to reach authentication server.")
            }

            const data = await safeJson(res)

            if (!res.ok) {
                console.error("❌ Login failed:", res.status, data)
                const msg = (data && (data.message || data.detail || data.error)) || "Invalid credentials or server error."
                throw new Error(msg)
            }

            const issuedToken = (data && (data.token || data.access || data.access_token))
            if (!issuedToken) {
                throw new Error("Token missing in login response (expected 'token' or 'access').")
            }

            devLog("✅ Login successful");
            saveAuthToken(issuedToken);
            setToken(issuedToken)

            const fetchedUser = await fetchUser(issuedToken)

            if (!fetchedUser) {
                // Do not immediately clear stored token; surface better error first
                const probeEndpoint = buildUrl(BASE_API, "/users/user/")
                throw new Error(`Failed to fetch user details after login. Verify authorization scheme and endpoint: ${probeEndpoint}`)
            }

            return fetchedUser
        } catch (error: any) {
            console.error("❌ Login error:", error)
            clearAuthToken()
            setUser(null)
            setToken(null)
            throw error
        } finally {
            setIsLoading(false)
        }
    };

    const loginWithToken = async (incomingToken: string): Promise<User> => {
        setIsLoading(true);
        try {
            devLog("🔑 Logging in with token...");
            saveAuthToken(incomingToken);
            setToken(incomingToken);

            const fetchedUser = await fetchUser(incomingToken);
            if (!fetchedUser) {
                const probeEndpoint = `${BASE_API}/users/user/`;
                throw new Error(`Failed to fetch user details with provided token. Verify authorization scheme and endpoint: ${probeEndpoint}`);
            }
            return fetchedUser;
        } catch (error) {
            console.error("❌ loginWithToken error:", error);
            clearAuthToken();
            setUser(null);
            setToken(null);
            throw error as Error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (!token) {
            devLog("ℹ️ No token to logout");
            return;
        }

        try {
            const endpoint = `${BASE_API}/users/logout/`;
            devLog("🚪 Logging out...");

            await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,  // Use Token for DRF TokenAuth
                    "Content-Type": "application/json",
                },
            }).catch(() => devLog("⚠️ Logout API failed, clearing state"));
        } finally {
            clearAuthToken();
            setToken(null);
            setUser(null);
            devLog("✅ Logged out");
        }
    };

    const isSuperAdmin =
        !!user?.is_superuser ||
        !!user?.groups?.some((g) => g.toLowerCase() === "admin") ||
        ["admin", "superadmin"].includes(user?.role?.toLowerCase() || "");

    const isHRAdmin =
        isSuperAdmin ||
        !!user?.groups?.some((g) => g.toLowerCase() === "hr") ||
        user?.role?.toLowerCase() === "hr";

    const isFinanceAdmin =
        isSuperAdmin ||
        !!user?.groups?.some((g) => g.toLowerCase() === "finance") ||
        user?.role?.toLowerCase() === "finance";

    const isAuditAdmin =
        isSuperAdmin ||
        !!user?.groups?.some((g) => g.toLowerCase() === "audit") ||
        user?.role?.toLowerCase() === "audit";

    // Convenience flag: super admin can manage anything on the frontend
    const canManageAll = !!isSuperAdmin

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                loginWithToken,
                logout,
                isHRAdmin,
                isFinanceAdmin,
                isAuditAdmin,
                isSuperAdmin,
                canManageAll,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};