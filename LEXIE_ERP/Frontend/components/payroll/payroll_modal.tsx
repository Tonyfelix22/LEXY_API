"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/utils/api"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PayrollRun {
    id?: number
    employee: number
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

interface Employee {
    id: number
    staff_number: string
    first_name: string
    last_name: string
    basic_salary: number
}

interface PayrollModalProps {
    isOpen: boolean
    payroll?: PayrollRun | null
    onClose: () => void
    onSave: (data: any) => void
    userRole?: "HR" | "Finance" | "Admin"
}

export default function PayrollModal({
    isOpen,
    payroll,
    onClose,
    onSave,
    userRole = "Admin",
}: PayrollModalProps) {
    const [formData, setFormData] = useState<PayrollRun>({
        employee: 0,
        period_start: "",
        period_end: "",
        basic_salary: 0,
        allowances: 0,
        overtime: 0,
        paye_tax: 0,
        nssf_deduction: 0,
        SHA_deduction: 0,
        other_deductions: 0,
    })

    const [employees, setEmployees] = useState<Employee[]>([])
    const [loadingEmployees, setLoadingEmployees] = useState(false)

    // ===== Derived Values =====
    const gross =
        (formData.basic_salary || 0) +
        (formData.allowances || 0) +
        (formData.overtime || 0)

    const deductions =
        (formData.paye_tax || 0) +
        (formData.nssf_deduction || 0) +
        (formData.SHA_deduction || 0) +
        (formData.other_deductions || 0)

    const net = Math.max(gross - deductions, 0)

    // ===== Fetch Employees =====
    const fetchEmployees = async () => {
        setLoadingEmployees(true)
        try {
            const data = await apiFetch("/hr/employees/")
            const results = data.results || data
            setEmployees(Array.isArray(results) ? results : [])
        } catch (err: any) {
            console.error("❌ Failed to fetch employees:", err)
            toast.error("Failed to load employees")
        } finally {
            setLoadingEmployees(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (payroll) {
            setFormData(payroll)
        } else {
            setFormData({
                employee: 0,
                period_start: "",
                period_end: "",
                basic_salary: 0,
                allowances: 0,
                overtime: 0,
                paye_tax: 0,
                nssf_deduction: 0,
                SHA_deduction: 0,
                other_deductions: 0,
            })
        }
    }, [payroll])

    // ===== Handlers =====
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const numericFields = [
            "basic_salary",
            "allowances",
            "overtime",
            "paye_tax",
            "nssf_deduction",
            "SHA_deduction",
            "other_deductions",
        ]

        if (numericFields.includes(name)) {
            // Remove commas to get raw number
            const rawValue = value.replace(/,/g, "")
            if (!isNaN(Number(rawValue))) {
                setFormData((prev) => ({ ...prev, [name]: Number(rawValue) }))
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleSelectEmployee = (value: string) => {
        const id = parseInt(value)
        const emp = employees.find((x) => x.id === id)
        setFormData((prev) => ({
            ...prev,
            employee: id,
            basic_salary: emp?.basic_salary || 0,
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employee) {
            toast.error("Select an employee")
            return
        }
        onSave({
            ...formData,
            gross_salary: gross,
            total_deductions: deductions,
            net_salary: net,
        })
    }

    if (!isOpen) return null

    // ===== Role-based Permissions =====
    const canEditEarnings = userRole === "HR" || userRole === "Admin"
    const canEditDeductions = userRole === "Finance" || userRole === "Admin"

    const readOnlyEarnings = !canEditEarnings
    const readOnlyDeductions = !canEditDeductions

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {payroll?.id ? "Edit Payroll Run" : "Create Payroll Run"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Employee + Dates */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 grid gap-1.5">
                            <Label>Employee</Label>
                            <Select
                                value={formData.employee ? formData.employee.toString() : ""}
                                onValueChange={handleSelectEmployee}
                                disabled={!!payroll}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            loadingEmployees ? "Loading..." : "Select an employee"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.staff_number} - {emp.first_name} {emp.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="period_start">Period Start</Label>
                            <Input
                                type="date"
                                id="period_start"
                                name="period_start"
                                value={formData.period_start}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="period_end">Period End</Label>
                            <Input
                                type="date"
                                id="period_end"
                                name="period_end"
                                value={formData.period_end}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Earnings */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-primary">
                            Earnings
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {["basic_salary", "allowances", "overtime"].map((field) => (
                                <div key={field} className="grid gap-1.5">
                                    <Label className="capitalize">
                                        {field.replace("_", " ")} (KES)
                                    </Label>
                                    <Input
                                        type="text"
                                        name={field}
                                        value={
                                            formData[field as keyof PayrollRun]
                                                ?.toString()
                                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || ""
                                        }
                                        onChange={handleChange}
                                        readOnly={readOnlyEarnings}
                                        className={
                                            readOnlyEarnings
                                                ? "opacity-50 cursor-not-allowed bg-muted"
                                                : ""
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 bg-primary/10 p-2 rounded text-sm font-medium text-primary border border-primary/20">
                            Gross Salary:{" "}
                            <span className="font-bold">KES {gross.toFixed(2)}</span>
                        </p>
                    </section>

                    {/* Deductions */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-primary">
                            Deductions
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                "paye_tax",
                                "nssf_deduction",
                                "SHA_deduction",
                                "other_deductions",
                            ].map((field) => (
                                <div key={field} className="grid gap-1.5">
                                    <Label className="capitalize">
                                        {field.replace("_", " ")} (KES)
                                    </Label>
                                    <Input
                                        type="text"
                                        name={field}
                                        value={
                                            formData[field as keyof PayrollRun]
                                                ?.toString()
                                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || ""
                                        }
                                        onChange={handleChange}
                                        readOnly={readOnlyDeductions}
                                        className={
                                            readOnlyDeductions
                                                ? "opacity-50 cursor-not-allowed bg-muted"
                                                : ""
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 bg-destructive/10 p-2 rounded text-sm font-medium text-destructive border border-destructive/20">
                            Total Deductions:{" "}
                            <span className="font-bold">KES {deductions.toFixed(2)}</span>
                        </p>
                    </section>

                    {/* Summary */}
                    <div className="bg-primary p-3 rounded border border-primary/20">
                        <p className="text-lg font-bold text-primary-foreground">
                            Net Salary: <span className="text-white">KES {net.toFixed(2)}</span>
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {(canEditEarnings || canEditDeductions) && (
                            <Button type="submit">Save</Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
