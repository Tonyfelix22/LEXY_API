"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import toast from "react-hot-toast"
import EmploymentHistoryTable from "@/components/hr/employee_history-table"
import EmployeeHistoryModal from "@/components/hr/employee_history-modal"
import { useAuth } from "@/context/auth-context"
import { apiFetch } from "@/utils/api"

interface Employee {
    id: number
    staff_number: string
    full_name: string
    department_name: string
    job_title: string
    basic_salary: number
    status: string
}

interface EmploymentRecord {
    id: number
    employee: Employee
    effective_date: string
    change_type: string
    previous_department?: number
    previous_department_name?: string
    previous_job_title?: string
    previous_salary?: number
    previous_status?: string
    new_department?: number
    new_department_name?: string
    new_job_title?: string
    new_salary?: number
    new_status?: string
    reason?: string
    notes?: string
    approved_by?: string
    created_at: string
    created_by: string
}

export default function EmployeeHistoryPage() {
    const { token, isHRAdmin } = useAuth()
    const [historyRecords, setHistoryRecords] = useState<EmploymentRecord[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [admins, setAdmins] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ✅ Load initial data
    useEffect(() => {
        if (!token) return
        if (!isHRAdmin) {
            setError("Access denied: HR administrators only.")
            setLoading(false)
            return
        }
        loadData()
    }, [token])

    const loadData = async () => {
        setLoading(true)
        try {
            await Promise.all([fetchEmployees(), fetchEmploymentHistory(), fetchAdmins(), fetchDepartments()])
        } catch (err: any) {
            console.error("Error loading HR data:", err)
            setError(err.message || "Failed to load HR data.")
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    // ✅ Fetch Employees
    const fetchEmployees = async () => {
        try {
            const data = await apiFetch("/hr/employees/", {
                headers: { Authorization: `Token ${token}` },
            })
            setEmployees(data.results || data)
        } catch (err: any) {
            console.error("Error fetching employees:", err)
            setError(`Failed to load employees: ${err.message}`)
            setEmployees([])
        }
    }

    // ✅ Fetch Employment History
    const fetchEmploymentHistory = async () => {
        try {
            const data = await apiFetch("/hr/employment-history/", {
                headers: { Authorization: `Token ${token}` },
            })
            setHistoryRecords(data.results || data)
        } catch (err: any) {
            console.error("Error fetching employment history:", err)
            setError(`Failed to load employment history: ${err.message}`)
            setHistoryRecords([])
        }
    }

    // ✅ Fetch Admins
    const fetchAdmins = async () => {
        try {
            const data = await apiFetch("/users/", {
                headers: { Authorization: `Token ${token}` },
            })
            const users = data.results || data
            const adminUsers = users.filter((u: any) => 
                u.is_superuser || 
                ["ADMIN", "HR", "MANAGER"].includes(u.profile?.role?.toUpperCase() || "")
            )
            setAdmins(adminUsers)
        } catch (err: any) {
            console.error("Error fetching admins:", err)
            setAdmins([])
        }
    }

    // ✅ Fetch Departments
    const fetchDepartments = async () => {
        try {
            const data = await apiFetch("/hr/departments/", {
                headers: { Authorization: `Token ${token}` },
            })
            setDepartments(data.results || data)
        } catch (err: any) {
            console.error("Error fetching departments:", err)
            setDepartments([])
        }
    }

    // ✅ Create a new record
    const handleCreateRecord = async (formData: Record<string, string>) => {
        try {
            const payload = {
                employee: parseInt(formData.employee_id),
                effective_date: formData.effective_date,
                change_type: formData.change_type,
                previous_department: formData.previous_department || null,
                previous_job_title: formData.previous_job_title || null,
                previous_salary: formData.previous_salary
                    ? parseFloat(formData.previous_salary)
                    : null,
                previous_status: formData.previous_status || null,
                new_department: formData.new_department ? parseInt(formData.new_department) : null,
                new_job_title: formData.new_job_title || null,
                new_salary: formData.new_salary
                    ? parseFloat(formData.new_salary)
                    : null,
                new_status: formData.new_status || null,
                reason: formData.reason || null,
                notes: formData.notes || null,
                approved_by: formData.approved_by || null,
            }

            await apiFetch("/hr/employment-history/", {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            toast.success("Employment record created successfully")
            setIsModalOpen(false)
            await fetchEmploymentHistory()
        } catch (err: any) {
            console.error("Error creating record:", err)
            toast.error(`Failed to create record: ${err.message}`)
        }
    }

    // ✅ Delete Record
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this record?")) return
        try {
            await apiFetch(`/hr/employment-history/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${token}` },
            })
            toast.success("Record deleted successfully")
            await fetchEmploymentHistory()
        } catch (err: any) {
            console.error("Error deleting record:", err)
            toast.error(`Failed to delete record: ${err.message}`)
        }
    }

    // ✅ Error or Access Handling
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="bg-white border border-red-300 p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        )
    }

    if (!isHRAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white border p-6 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Employment History
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Manage and track all employee employment changes
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors shadow-lg shadow-sky-500/20"
                    >
                        <Plus size={20} />
                        New Record
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <EmploymentHistoryTable
                    records={historyRecords}
                    expandedId={expandedId}
                    onToggleExpand={setExpandedId}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal */}
            <EmployeeHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                employees={employees}
                admins={admins}
                departments={departments}
                onSubmit={handleCreateRecord}
            />
        </div>
    )
}
