"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { apiFetch } from "@/utils/api"
import toast from "react-hot-toast"

interface Budget {
    id?: number
    name: string
    department: number | null
    amount: number | string
    start_date: string
    end_date: string
    description: string
}

interface Department {
    id: number
    name: string
}

interface BudgetModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    budget?: Budget | null
}

export default function BudgetModal({ isOpen, onClose, onSave, budget }: BudgetModalProps) {
    const [formData, setFormData] = useState<Budget>({
        name: "",
        department: null,
        amount: "",
        start_date: "",
        end_date: "",
        description: "",
    })
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchDepartments()
            if (budget) {
                setFormData({
                    ...budget,
                    amount: budget.amount.toString(), // Ensure string for input
                })
            } else {
                setFormData({
                    name: "",
                    department: null,
                    amount: "",
                    start_date: new Date().toISOString().split("T")[0],
                    end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0], // End of year default
                    description: "",
                })
            }
        }
    }, [isOpen, budget])

    const fetchDepartments = async () => {
        try {
            const data = await apiFetch("/hr/departments/")
            setDepartments(data.results || data)
        } catch (error) {
            console.error("Failed to fetch departments:", error)
            toast.error("Failed to load departments")
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === "department" ? (value ? parseInt(value) : null) : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount.toString()),
            }

            if (budget?.id) {
                await apiFetch(`/finance/budgets/${budget.id}/`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                })
                toast.success("Budget updated successfully")
            } else {
                await apiFetch("/finance/budgets/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
                toast.success("Budget created successfully")
            }
            onSave()
            onClose()
        } catch (error) {
            console.error("Failed to save budget:", error)
            toast.error("Failed to save budget")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {budget ? "Edit Budget" : "New Budget"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            placeholder="e.g., Q1 Marketing Budget"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            name="department"
                            value={formData.department || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        >
                            <option value="">Select Department (Optional)</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount (KES)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            placeholder="Optional details..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : "Save Budget"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
