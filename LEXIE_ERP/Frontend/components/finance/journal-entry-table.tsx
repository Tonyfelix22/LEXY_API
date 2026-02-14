"use client"

interface JournalEntry {
    id: number
    date: string
    description: string
    reference?: string | null
    created_at?: string
}

interface JournalEntryTableProps {
    entries: JournalEntry[]
    onEdit: (entry: JournalEntry) => void
    onDelete: (id: number) => void
}

export default function JournalEntryTable({ entries, onEdit, onDelete }: JournalEntryTableProps) {
    const formatDate = (date: string) => {
        try {
            return new Date(date).toISOString().split("T")[0]
        } catch {
            return date
        }
    }

    return (
        <div className="bg-slate-800 rounded-lg shadow border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Reference</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Description</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Created</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 text-slate-300">{formatDate(entry.date)}</td>
                            <td className="px-6 py-4 font-medium text-white">
                                {entry.reference || <span className="text-slate-500">—</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-300 max-w-xs truncate" title={entry.description}>
                                {entry.description || <span className="text-slate-500">No description</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                                {entry.created_at ? formatDate(entry.created_at) : "—"}
                            </td>
                            <td className="px-6 py-4 space-x-2">
                                <button
                                    onClick={() => onEdit(entry)}
                                    className="text-sky-400 hover:underline font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(entry.id)}
                                    className="text-red-400 hover:underline font-medium"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {entries.length === 0 && (
                <div className="text-center py-8 text-slate-500">No journal entries found</div>
            )}
        </div>
    )
}
