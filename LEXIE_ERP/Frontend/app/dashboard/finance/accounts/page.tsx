"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"
import { apiFetch } from "@/utils/api"
import AccountTable from "@/components/finance/account-table"
import AccountModal from "@/components/finance/account-modal"

interface Account {
    id: number
    code: string
    name: string
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE" // Updated to match Table
    balance: number | string
    parent?: number | null
    parent_name?: string
}

export default function AccountsPage() {
    const { token, isFinanceAdmin } = useAuth()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [error, setError] = useState<string | null>(null)

    // ✅ Fetch accounts on token or page change
    useEffect(() => {
        if (!token) return
        if (!isFinanceAdmin) {
            setError("Access denied: Finance Admins only.")
            setIsLoading(false)
            return
        }
        fetchAccounts()
    }, [page, token])

    // ✅ Fetch accounts securely
    const fetchAccounts = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await apiFetch(`/finance/accounts/?page=${page}`, {
                headers: { Authorization: `Token ${token}` },
            })
            const results = Array.isArray(data.results) ? data.results : data
            // Map backend 'account_type' to frontend 'type' if needed, or assume backend sends 'type' or 'account_type'
            // Assuming backend sends 'account_type' based on previous code, but Table expects 'type'.
            // Let's map it.
            setAccounts(results.map((acc: any) => ({
                ...acc,
                type: acc.account_type || acc.type // Handle both cases
            })))
            if (data.count) setTotalPages(Math.ceil(data.count / 10))
        } catch (err: any) {
            console.error("❌ Failed to fetch accounts:", err)
            setError(err.message || "Failed to fetch accounts")
            toast.error("Failed to fetch accounts")
            setAccounts([])
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ Save account (Create or Update)
    const handleSaveAccount = async (formData: any) => {
        try {
            const url = selectedAccount
                ? `/finance/accounts/${selectedAccount.id}/`
                : `/finance/accounts/`
            const method = selectedAccount ? "PUT" : "POST"

            await apiFetch(url, {
                method,
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            toast.success(selectedAccount ? "Account updated" : "Account created")
            setIsModalOpen(false)
            setSelectedAccount(null)
            await fetchAccounts()
        } catch (err: any) {
            console.error("❌ Failed to save account:", err)
            toast.error(err.message || "Failed to save account")
        }
    }

    // ✅ Delete account
    const handleDeleteAccount = async (id: number) => {
        if (!confirm("Are you sure you want to delete this account?")) return
        try {
            await apiFetch(`/finance/accounts/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${token}` },
            })
            toast.success("Account deleted successfully")
            await fetchAccounts()
        } catch (err: any) {
            console.error("❌ Failed to delete account:", err)
            toast.error(err.message || "Failed to delete account")
        }
    }

    // ✅ UI Handlers
    const handleAddAccount = () => {
        setSelectedAccount(null)
        setIsModalOpen(true)
    }

    const handleEditAccount = (account: Account) => {
        setSelectedAccount(account)
        setIsModalOpen(true)
    }

    // 🚫 Restrict unauthorized access
    if (!isFinanceAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        You do not have permission to view or manage accounts.
                    </p>
                </div>
            </div>
        )
    }

    // ⚠️ Error UI
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="bg-white border border-red-300 p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={fetchAccounts}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // 🌀 Loading UI
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // ✅ Main Render
    return (
        <div className="min-h-screen bg-slate-900 px-8 py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Accounts</h1>
                <button
                    onClick={handleAddAccount}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition font-medium shadow-lg shadow-sky-500/20"
                >
                    + Add Account
                </button>
            </div>

            <AccountTable
                accounts={accounts}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
            />

            {/* Pagination */}
            {accounts.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-muted">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <AccountModal
                    account={selectedAccount}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedAccount(null)
                    }}
                    onSave={handleSaveAccount}
                />
            )}
        </div>
    )
}
