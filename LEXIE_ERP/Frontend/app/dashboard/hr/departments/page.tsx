"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import DepartmentTable from "@/components/hr/department-table"
import DepartmentModal from "@/components/hr/department-modal"
import { apiFetch } from "@/utils/api"
import { useAuth } from "@/context/auth-context"

interface Department {
    id: number
    name: string
    code: string
    description?: string
    manager?: number
    manager_name?: string
    employee_count?: number
}

export default function DepartmentsPage() {
    const { token, isHRAdmin } = useAuth()

    const [departments, setDepartments] = useState<Department[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ✅ Fetch departments when token changes
    useEffect(() => {
        if (!token) return
        if (!isHRAdmin) {
            setError("Access denied: HR administrators only.")
            setIsLoading(false)
            return
        }
        fetchDepartments()
    }, [token])

    // ✅ Fetch all departments
    const fetchDepartments = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await apiFetch("/hr/departments/", {
                headers: { Authorization: `Token ${token}` },
            })
            setDepartments(Array.isArray(data.results) ? data.results : data)
        } catch (err: any) {
            console.error("❌ Failed to fetch departments:", err)
            setError(err.message || "Failed to fetch departments")
            toast.error("Failed to fetch departments")
            setDepartments([])
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ Save or update a department
    const handleSave = async (formData: any) => {
        try {
            const url = selectedDepartment
                ? `/hr/departments/${selectedDepartment.id}/`
                : `/hr/departments/`
            const method = selectedDepartment ? "PUT" : "POST"

            await apiFetch(url, {
                method,
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            toast.success(selectedDepartment ? "Department updated" : "Department created")
            setShowModal(false)
            setSelectedDepartment(null)
            await fetchDepartments()
        } catch (err: any) {
            console.error("❌ Error saving department:", err)
            toast.error(err.message || "Failed to save department")
        }
    }

    // ✅ Delete a department
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this department?")) return
        try {
            await apiFetch(`/hr/departments/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${token}` },
            })
            toast.success("Department deleted successfully")
            await fetchDepartments()
        } catch (err: any) {
            console.error("❌ Error deleting department:", err)
            toast.error(err.message || "Failed to delete department")
        }
    }

    // ✅ Edit / Create handlers
    const handleEdit = (department: Department) => {
        setSelectedDepartment(department)
        setShowModal(true)
    }

    const handleCreateNew = () => {
        setSelectedDepartment(null)
        setShowModal(true)
    }

    // ✅ Handle access restriction
    if (!isHRAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white border p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        You do not have permission to manage departments.
                    </p>
                </div>
            </div>
        )
    }

    // ✅ Handle error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="bg-white border border-red-300 p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={fetchDepartments}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // ✅ Handle loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // ✅ Main render
    return (
        <div className="min-h-screen bg-slate-900 px-8 py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Departments</h1>
                <button
                    onClick={handleCreateNew}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition font-medium shadow-lg shadow-sky-500/20"
                >
                    + Add Department
                </button>
            </div>

            <DepartmentTable
                departments={departments}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <DepartmentModal
                    department={selectedDepartment}
                    onClose={() => {
                        setShowModal(false)
                        setSelectedDepartment(null)
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
