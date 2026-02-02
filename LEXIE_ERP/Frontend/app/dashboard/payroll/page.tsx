'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiFetch as api } from '@/utils/api'
import PayrollModal from '@/components/payroll/payroll_modal'

interface PayrollRun {
    id?: number
    employee: number
    employee_name?: string
    employee_staff_number?: string
    period_start: string
    period_end: string
    basic_salary: number
    allowances: number
    overtime: number
    paye_tax: number
    nssf_deduction: number
    SHA_deduction: number
    other_deductions: number
}

export default function PayrollPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null)
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchPayrollRuns()
    }, [])

    const fetchPayrollRuns = async () => {
        setLoading(true)
        try {
            const data = await api('/hr/payroll_runs/')
            const runs = data.results || data
            setPayrollRuns(Array.isArray(runs) ? runs : [])
        } catch (error: any) {
            console.error('Failed to fetch payroll runs:', error)
            toast.error('Failed to fetch payroll runs')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (payroll?: PayrollRun) => {
        setSelectedPayroll(payroll || null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedPayroll(null)
    }

    const handleSavePayroll = async (
        data: PayrollRun & {
            gross_salary: number
            total_deductions: number
            net_salary: number
        }
    ) => {
        try {
            const method = data.id ? 'PATCH' : 'POST'
            const endpoint = data.id
                ? `/hr/payroll_runs/${data.id}/`
                : '/hr/payroll_runs/'

            await api(endpoint, {
                method,
                body: JSON.stringify(data),
            })

            toast.success(data.id ? 'Payroll run updated' : 'Payroll run created')
            fetchPayrollRuns()
            handleCloseModal()
        } catch (error: any) {
            console.error('Failed to save payroll:', error)
            toast.error('Failed to save payroll run')
        }
    }

    const handleDeletePayroll = async (id: number) => {
        if (!confirm('Are you sure you want to delete this payroll run?')) return

        try {
            await api(`/hr/payroll_runs/${id}/`, { method: 'DELETE' })
            toast.success('Payroll run deleted')
            fetchPayrollRuns()
        } catch (error: any) {
            console.error('Failed to delete payroll:', error)
            toast.error('Failed to delete payroll run')
        }
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                    Create Payroll Run
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <p className="text-foreground">Loading payroll runs...</p>
                </div>
            ) : payrollRuns.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-foreground text-lg">No payroll runs found</p>
                </div>
            ) : (
                <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b border-border">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">Employee</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">Period</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-foreground">Gross Salary</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-foreground">Deductions</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-foreground">Net Salary</th>
                                <th className="px-4 py-2 text-center text-sm font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollRuns.map((run) => {
                                const gross = run.basic_salary + run.allowances + run.overtime
                                const deductions =
                                    run.paye_tax + run.nssf_deduction + run.SHA_deduction + run.other_deductions
                                const net = gross - deductions

                                return (
                                    <tr key={run.id} className="border-b border-border hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-foreground">{run.employee_name || run.employee}</td>
                                        <td className="px-4 py-2 text-sm text-foreground">
                                            {run.period_start} to {run.period_end}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right text-foreground">{gross.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-right text-foreground">{deductions.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-right font-semibold text-success">{net.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleOpenModal(run)}
                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => run.id && handleDeletePayroll(run.id)}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <PayrollModal
                isOpen={isModalOpen}
                payroll={selectedPayroll}
                onClose={handleCloseModal}
                onSave={handleSavePayroll}
            />
        </div>
    )
}

