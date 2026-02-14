"use client"

import React from "react"

interface Account {
    id: number
    code: string
    name: string
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
    balance: number | string
    parent?: number | null
    parent_name?: string
}

interface AccountTableProps {
    accounts: Account[]
    onEdit: (account: Account) => void
    onDelete: (id: number) => void
}

export default function AccountTable({ accounts, onEdit, onDelete }: AccountTableProps) {
    const formatBalance = (balance: number | string) => {
        const num = typeof balance === "string" ? parseFloat(balance) : balance
        return isNaN(num) ? "0.00" : num.toLocaleString("en-US", { minimumFractionDigits: 2 })
    }

    const getTypeColor = (type: Account["type"]) => {
        switch (type) {
            case "ASSET":
                return "bg-green-100 text-green-800"
            case "LIABILITY":
                return "bg-yellow-100 text-yellow-800"
            case "EQUITY":
                return "bg-purple-100 text-purple-800"
            case "INCOME":
                return "bg-blue-100 text-blue-800"
            case "EXPENSE":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <div className="bg-slate-800 rounded-lg shadow border border-slate-700 overflow-hidden">
            <table className="w-full border-collapse">
                <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Code</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Parent</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Balance</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                                {account.code}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{account.name}</td>
                            <td className="px-6 py-4 text-sm">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}
                                >
                                    {account.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                                {account.parent_name ? account.parent_name : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-right text-white">
                                ${formatBalance(account.balance)}
                            </td>
                            <td className="px-6 py-4 text-sm text-center space-x-3">
                                <button
                                    onClick={() => onEdit(account)}
                                    className="text-sky-400 hover:underline font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(account.id)}
                                    className="text-red-400 hover:underline font-medium"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {accounts.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500">No accounts found</div>
            )}
        </div>
    )
}
