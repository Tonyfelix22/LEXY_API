"use client"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import EmployeeTable from "@/components/hr/employee-table"
import EmployeeModal from "@/components/hr/employee-modal"
import { useAuth } from "@/context/auth-context"
import { apiFetch } from "@/utils/api"

interface Employee {
    id: number
    staff_number: string
    first_name: string
    last_name: string
    full_name: string // Added to match Table requirement
    middle_name?: string
    email: string
    phone?: string
    national_id: string
    job_title: string
    employment_type: string
    department: number
    department_name?: string
    hire_date: string
    basic_salary: number | string
    kra_pin?: string
    nssf_number?: string
    SHA_number?: string
    status: string
}

export default function EmployeesPage() {
    const { token, isHRAdmin } = useAuth()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (token && isHRAdmin) {
            fetchEmployees()
        } else if (!isHRAdmin) {
            setError("Access denied: HR Admins only.")
            setIsLoading(false)
        }
    }, [page, token, isHRAdmin, fetchEmployees])

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await apiFetch(`/hr/employees/?page=${page}`, {
                headers: { Authorization: `Token ${token}` },
            })
 
            const empList = data.results || data
            setEmployees(Array.isArray(empList) ? empList.map((e: any) => ({
                ...e,
                full_name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
                // Ensure department_name is present if the API returns it, otherwise it might be missing
                department_name: e.department_name || "—"
            })) : [])
 
            if (data.count) {
                setTotalPages(Math.ceil(data.count / 10))
            } else {
                setTotalPages(1)
            }
        } catch (error: any) {
            console.error("Failed to fetch employees:", error)
            toast.error(error.message || "Failed to fetch employees")
            setError("Could not load employee data. Please try again.")
            setEmployees([])
        } finally {
            setIsLoading(false)
        }
    }, [page, token])

    const handleSave = async (formData: any) => {
        try {
            const method = selectedEmployee ? "PUT" : "POST"
            const endpoint = selectedEmployee
                ? `/hr/employees/${selectedEmployee.id}/`
                : `/hr/employees/`

            await apiFetch(endpoint, {
                method,
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            toast.success(selectedEmployee ? "Employee updated" : "Employee created")
            setShowModal(false)
            setSelectedEmployee(null)
            fetchEmployees()
        } catch (error: any) {
            console.error("Error saving employee:", error)
            toast.error(error.message || "Failed to save employee")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this employee?")) return

        try {
            await apiFetch(`/hr/employees/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${token}` },
            })
            toast.success("Employee deleted successfully")
            fetchEmployees()
        } catch (error: any) {
            console.error("Error deleting employee:", error)
            toast.error(error.message || "Failed to delete employee")
        }
    }

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee)
        setShowModal(true)
    }

    const handleCreateNew = () => {
        setSelectedEmployee(null)
        setShowModal(true)
    }

    // ✅ Error and Access Control Rendering
    if (error) {
        return (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-semibold">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-8 rounded-3xl border border-[#0ea5e9]/10">
            <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#1e3a8a]">Employee Directory</h1>
                    <p className="text-slate-500 font-medium">Manage your workforce, update profiles and track employment status</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a] text-white shadow-lg hover:shadow-[#1e3a8a]/30 transition-all duration-300 rounded-xl px-8 py-4 h-auto font-bold flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Add New Professional
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0ea5e9]"></div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <EmployeeTable
                        employees={employees}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />

                    {employees.length > 0 && (
                        <div className="flex items-center justify-between mt-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-[#0ea5e9]/10 shadow-sm">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-6 py-2 bg-white text-[#1e3a8a] border-2 border-[#1e3a8a]/10 rounded-xl hover:bg-[#1e3a8a] hover:text-white transition-all font-bold disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1e3a8a]"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-black text-[#1e3a8a] uppercase tracking-widest">
                                Page <span className="text-[#0ea5e9] px-2">{page}</span> of <span className="text-[#0ea5e9] px-2">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-6 py-2 bg-white text-[#1e3a8a] border-2 border-[#1e3a8a]/10 rounded-xl hover:bg-[#1e3a8a] hover:text-white transition-all font-bold disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1e3a8a]"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <EmployeeModal
                    employee={selectedEmployee}
                    onClose={() => {
                        setShowModal(false)
                        setSelectedEmployee(null)
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
