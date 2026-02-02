"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/utils/api"
import toast from "react-hot-toast"
import { Edit, Trash2, Plus } from "lucide-react"
import BudgetModal from "./budget-modal"
import { budgetService, Budget } from "@/services/budgetService"
import { CheckCircle, XCircle } from "lucide-react"



export default function BudgetTable() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

    const fetchBudgets = async () => {
        setLoading(true)
        try {
            const data = await budgetService.getAll()
            setBudgets(data)
        } catch (error) {
            console.error("Failed to fetch budgets:", error)
            toast.error("Failed to load budgets")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBudgets()
    }, [])

    const handleCreate = () => {
        setSelectedBudget(null)
        setIsModalOpen(true)
    }

    const handleEdit = (budget: Budget) => {
        setSelectedBudget(budget)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this budget?")) return

        try {
            await budgetService.delete(id)
            toast.success("Budget deleted")
            fetchBudgets()
        } catch (error) {
            console.error("Failed to delete budget:", error)
            toast.error("Failed to delete budget")
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    if (loading) {
        return <div className="p-4 text-center">Loading budgets...</div>
    }

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Department Budgets</h2>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Budget
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Utilization</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {budgets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No active budgets found.
                                </td>
                            </tr>
                        ) : (
                            budgets.map((budget) => (
                                <tr key={budget.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{budget.department_name || budget.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${budget.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            budget.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {budget.status || 'DRAFT'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {formatCurrency(Number(budget.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {formatCurrency(Number(budget.spent_amount))}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {formatCurrency(Number(budget.remaining_amount))}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${budget.utilization > 90 ? "bg-red-500" :
                                                        budget.utilization > 75 ? "bg-yellow-500" : "bg-blue-500"
                                                        }`}
                                                    style={{ width: `${Math.min(budget.utilization, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                                {budget.utilization}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(budget)}
                                            className="text-gray-400 hover:text-primary transition-colors mr-3"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {budget.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        await budgetService.approve(budget.id)
                                                        toast.success("Budget Approved")
                                                        fetchBudgets()
                                                    }}
                                                    className="text-gray-400 hover:text-green-600 transition-colors mr-3"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Reject this budget?")) return
                                                        await budgetService.reject(budget.id)
                                                        toast.success("Budget Rejected")
                                                        fetchBudgets()
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors mr-3"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <BudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchBudgets}
                budget={selectedBudget}
            />
        </div>
    )
}
