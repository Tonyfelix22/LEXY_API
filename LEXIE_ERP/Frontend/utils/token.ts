// utils/token.ts

// ✅ Retrieve token from localStorage
export function getAuthToken(): string | null {
    if (typeof window !== "undefined") {
        return localStorage.getItem("authToken");
    }
    return null;
}

// ✅ Save token to localStorage
export function saveAuthToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("authToken", token);
}

// ✅ Clear token from localStorage
export function clearAuthToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
}
