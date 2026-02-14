"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"
import { apiFetch } from "@/utils/api"
import JournalEntryTable from "@/components/finance/journal-entry-table"
import JournalEntryModal from "@/components/finance/journal-entry-modal"

interface JournalEntry {
    id: number
    date: string
    description: string
    reference: string
    status?: string // Made optional to match Table's loose requirement or lack thereof
    created_at?: string // Added as Table uses it
}

export default function JournalEntriesPage() {
    const { token, isFinanceAdmin } = useAuth()

    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [error, setError] = useState<string | null>(null)

    // ✅ Fetch journal entries whenever page or token changes
    useEffect(() => {
        if (!token) return
        if (!isFinanceAdmin) {
            setError("Access denied: Finance Admins only.")
            setIsLoading(false)
            return
        }
        fetchEntries()
    }, [page, token])

    // ✅ Unified data fetch
    const fetchEntries = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await apiFetch(`/finance/journals/?page=${page}`, {
                headers: { Authorization: `Token ${token}` },
            })

            const results = Array.isArray(data.results) ? data.results : data
            setEntries(results)

            if (data.count) {
                setTotalPages(Math.ceil(data.count / 10))
            }
        } catch (err: any) {
            console.error("❌ Failed to fetch journal entries:", err)
            setError(err.message || "Failed to fetch journal entries")
            toast.error("Failed to fetch journal entries")
            setEntries([])
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ Save (create or update)
    const handleSaveEntry = async (formData: any) => {
        try {
            const url = selectedEntry
                ? `/finance/journals/${selectedEntry.id}/`
                : `/finance/journals/`
            const method = selectedEntry ? "PUT" : "POST"

            await apiFetch(url, {
                method,
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            toast.success(selectedEntry ? "Journal updated" : "Journal created")
            setIsModalOpen(false)
            setSelectedEntry(null)
            await fetchEntries()
        } catch (err: any) {
            console.error("❌ Error saving journal entry:", err)
            toast.error(err.message || "Failed to save journal entry")
        }
    }

    // ✅ Delete entry
    const handleDeleteEntry = async (id: number) => {
        if (!confirm("Are you sure you want to delete this journal entry?")) return
        try {
            await apiFetch(`/finance/journals/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${token}` },
            })
            toast.success("Journal entry deleted successfully")
            await fetchEntries()
        } catch (err: any) {
            console.error("❌ Error deleting journal entry:", err)
            toast.error(err.message || "Failed to delete journal entry")
        }
    }

    // ✅ UI handlers
    const handleAddEntry = () => {
        setSelectedEntry(null)
        setIsModalOpen(true)
    }

    const handleEditEntry = (entry: JournalEntry) => {
        setSelectedEntry(entry)
        setIsModalOpen(true)
    }

    // 🚫 Restrict unauthorized users
    if (!isFinanceAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        You do not have permission to view or manage journal entries.
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
                        onClick={fetchEntries}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // 🌀 Loading state
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
                <h1 className="text-3xl font-bold text-white">Journal Entries</h1>
                <button
                    onClick={handleAddEntry}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition font-medium shadow-lg shadow-sky-500/20"
                >
                    + Add Entry
                </button>
            </div>

            <JournalEntryTable
                entries={entries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
            />

            {entries.length > 0 && (
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

            {isModalOpen && (
                <JournalEntryModal
                    entry={selectedEntry}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedEntry(null)
                    }}
                    onSave={handleSaveEntry}
                />
            )}
        </div>
    )
}
