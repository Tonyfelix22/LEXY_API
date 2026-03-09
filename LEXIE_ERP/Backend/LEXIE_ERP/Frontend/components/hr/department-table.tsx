"use client"

import { useAuth } from "@/context/auth-context"
import toast from "react-hot-toast"
import { useState } from "react"

interface Department {
    id: number
    name: string
    code: string
    description?: string
    manager?: number
    manager_name?: string
    employee_count?: number
}

interface DepartmentTableProps {
    departments: Department[]
    onEdit: (department: Department) => void
    onDelete: (id: number) => Promise<void> | void
}

export default function DepartmentTable({ departments, onEdit, onDelete }: DepartmentTableProps) {
    const { user } = useAuth()
    const role = user?.groups?.[0]?.toUpperCase() || "USER"
    const isHR = role.includes("HR")
    const isAdmin = role.includes("ADMIN")

    const [deletingId, setDeletingId] = useState<number | null>(null)

    const handleDelete = async (id: number, name: string) => {
        if (!isHR && !isAdmin) {
            toast.error("You are not authorized to delete departments.")
            return
        }

        if (!confirm(`Are you sure you want to delete department "${name}"? This action cannot be undone.`)) {
            return
        }

        setDeletingId(id)
        try {
            await onDelete(id)
            toast.success(`Department "${name}" deleted successfully`)
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete department")
        } finally {
            setDeletingId(null)
        }
    }

    if (departments.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg shadow border border-slate-700 overflow-hidden text-center py-8 text-slate-400">
                No departments found
            </div>
        )
    }

    return (
        <div className="bg-slate-800 rounded-xl shadow border border-slate-700 overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Code</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Description</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Manager</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Employees</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-700">
                    {departments.map((department) => (
                        <tr key={department.id} className="hover:bg-slate-700/50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-white">{department.code}</td>
                            <td className="px-6 py-4 text-sm font-medium text-white">{department.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-300 truncate max-w-xs">
                                {department.description || <span className="text-slate-500">—</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                                {department.manager_name || <span className="text-slate-500">Unassigned</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300 text-center">
                                {department.employee_count ?? 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-right space-x-2">
                                {(isHR || isAdmin) && (
                                    <>
                                        <button
                                            onClick={() => onEdit(department)}
                                            className="text-sky-400 hover:text-sky-300 hover:underline font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(department.id, department.name)}
                                            disabled={deletingId === department.id}
                                            className={`text-red-400 font-medium ${deletingId === department.id
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:text-red-300 hover:underline"
                                                }`}
                                        >
                                            {deletingId === department.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </>
                                )}
                                {!isHR && !isAdmin && (
                                    <span className="text-slate-500 italic text-xs">Read-only</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
