'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiFetch as api } from '@/utils/api'
import PayrollModal from '@/components/payroll/payroll_modal'
import PayrollTable from '@/components/payroll/payroll_table'

interface PayrollRun {
    id: number
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
    gross_salary: number
    total_deductions: number
    net_salary: number
    status: string
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
        data: any
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Payroll Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                >
                    Create Payroll Run
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <p className="text-primary">Loading payroll runs...</p>
                </div>
            ) : (
                <PayrollTable
                    payrolls={payrollRuns}
                    onEdit={handleOpenModal}
                    onDelete={handleDeletePayroll}
                    onCalculate={async (payroll) => {
                        try {
                            await api(`/hr/payroll_runs/${payroll.id}/calculate/`, { method: "POST" })
                            toast.success("Payroll calculated successfully")
                            fetchPayrollRuns()
                        } catch (error) {
                            console.error(error)
                            toast.error("Failed to calculate payroll")
                        }
                    }}
                    onApprove={async (payroll) => {
                        try {
                            await api(`/hr/payroll_runs/${payroll.id}/approve/`, { method: "POST" })
                            toast.success("Payroll approved successfully")
                            fetchPayrollRuns()
                        } catch (error) {
                            console.error(error)
                            toast.error("Failed to approve payroll")
                        }
                    }}
                />
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
