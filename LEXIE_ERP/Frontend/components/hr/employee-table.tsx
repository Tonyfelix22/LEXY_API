"use client"

import { useMemo } from "react"
import { Edit2, Trash2 } from "lucide-react"

interface Employee {
    id: number
    staff_number: string
    full_name: string
    first_name: string
    last_name: string
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
    years_of_service?: number
}

interface EmployeeTableProps {
    employees: Employee[]
    onEdit: (employee: Employee) => void
    onDelete: (id: number) => void
}

export default function EmployeeTable({ employees, onEdit, onDelete }: EmployeeTableProps) {
    const formattedEmployees = useMemo(() => {
        return employees.map((e) => ({
            ...e,
            basic_salary: parseFloat(String(e.basic_salary || 0)).toFixed(2),
        }))
    }, [employees])

    if (!employees || employees.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center text-slate-400">
                No employees found.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow border border-slate-700">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Staff No</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Department</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Hire Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Salary (KES)</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-300">Status</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {formattedEmployees.map((employee) => (
                        <tr
                            key={employee.id}
                            className="hover:bg-slate-700/50 transition-colors duration-100"
                        >
                            <td className="px-6 py-4 text-slate-300">{employee.staff_number}</td>
                            <td className="px-6 py-4 font-medium text-white">{employee.full_name}</td>
                            <td className="px-6 py-4 text-slate-300">{employee.department_name || "—"}</td>
                            <td className="px-6 py-4 text-slate-300">{employee.hire_date}</td>
                            <td className="px-6 py-4 text-slate-300">
                                {new Intl.NumberFormat("en-KE", {
                                    style: "currency",
                                    currency: "KES",
                                }).format(Number(employee.basic_salary))}
                            </td>
                            <td className="px-6 py-4">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${employee.status === "ACTIVE"
                                        ? "bg-green-900/30 text-green-400 border border-green-900/50"
                                        : "bg-red-900/30 text-red-400 border border-red-900/50"
                                        }`}
                                >
                                    {employee.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <button
                                    onClick={() => onEdit(employee)}
                                    className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                                    title="Edit Employee"
                                >
                                    <Edit2 size={16} />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                    onClick={() => onDelete(employee.id)}
                                    className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                                    title="Delete Employee"
                                >
                                    <Trash2 size={16} />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
