"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/utils/api"
import { useAuth } from "@/context/auth-context"
import toast from "react-hot-toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input as StandardInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select as StandardSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Employee {
    id: number
    staff_number: string
    first_name: string
    last_name: string
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

interface EmployeeModalProps {
    employee: Employee | null
    onClose: () => void
    onSave: (data: any) => Promise<void> | void
}

export default function EmployeeModal({
    employee,
    onClose,
    onSave,
}: EmployeeModalProps) {
    const { user, isHRAdmin, isSuperAdmin } = useAuth()

    // Allow HR Admin or Super Admin (though backend may restrict Super Admin for creation)
    const canManageEmployees = isHRAdmin || isSuperAdmin

    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchingDepartments, setFetchingDepartments] = useState(false)

    const [formData, setFormData] = useState({
        staff_number: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone: "",
        national_id: "",
        job_title: "",
        employment_type: "",
        department: "",
        hire_date: "",
        basic_salary: "",
        kra_pin: "",
        nssf_number: "",
        SHA_number: "",
        status: "ACTIVE",
        username: "",
        password: "",
        role: "STAFF",
    })

    useEffect(() => {
        if (employee) {
            setFormData({
                staff_number: employee.staff_number || "",
                first_name: employee.first_name || "",
                last_name: employee.last_name || "",
                middle_name: employee.middle_name || "",
                email: employee.email || "",
                phone: employee.phone || "",
                national_id: employee.national_id || "",
                job_title: employee.job_title || "",
                employment_type: employee.employment_type || "",
                department: employee.department?.toString() || "",
                hire_date: employee.hire_date || "",
                basic_salary: employee.basic_salary?.toString() || "",
                kra_pin: employee.kra_pin || "",
                nssf_number: employee.nssf_number || "",
                SHA_number: employee.SHA_number || "",
                status: employee.status || "ACTIVE",
                username: "", // Don't show existing username/password
                password: "",
                role: "STAFF", // Default or fetch if available
            })
        }
        fetchDepartments()
    }, [employee])

    const fetchDepartments = async () => {
        setFetchingDepartments(true)
        try {
            const data = await apiFetch("/hr/departments/")
            setDepartments(data.results || data)
        } catch (error) {
            toast.error("Failed to fetch departments. Please retry.")
            console.error(error)
        } finally {
            setFetchingDepartments(false)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Helper for our custom Select to bridge with existing handleChange
    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canManageEmployees) {
            toast.error("You are not authorized to modify employee records.")
            return
        }

        setLoading(true)
        try {
            const payload: any = {
                ...formData,
                department: Number.parseInt(formData.department),
                basic_salary: Number.parseFloat(formData.basic_salary),
            }

            // Remove empty optional fields
            if (!payload.username) delete payload.username
            if (!payload.password) delete payload.password
            if (!employee) {
                // For new employees, staff_number is auto-generated
                delete payload.staff_number
            }

            await onSave(payload)
            toast.success(`Employee ${employee ? "updated" : "added"} successfully`)
            onClose()
        } catch (err) {
            console.error(err)
            toast.error("Failed to save employee")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {employee ? "Edit Employee" : "Add Employee"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* --- Section: User Account (New Employee Only) --- */}
                    {!employee && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2 text-primary">
                                User Account
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <Select
                                    label="Role"
                                    name="role"
                                    value={formData.role}
                                    onChange={(val: string) => handleSelectChange("role", val)}
                                    options={[
                                        { value: "STAFF", label: "Staff" },
                                        { value: "MANAGER", label: "Manager" },
                                        { value: "HR", label: "HR Admin" },
                                        { value: "FINANCE", label: "Finance Admin" },
                                        { value: "AUDIT", label: "Audit Admin" },
                                        { value: "ADMIN", label: "Administrator" },
                                    ]}
                                    required
                                />
                            </div>
                        </section>
                    )}

                    {/* --- Section: Personal Info --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 text-primary">
                            Personal Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {employee ? (
                                <Input
                                    label="Staff Number"
                                    name="staff_number"
                                    value={formData.staff_number}
                                    onChange={handleChange}
                                    required
                                />
                            ) : (
                                <div className="grid w-full gap-1.5">
                                    <Label>Staff Number</Label>
                                    <StandardInput
                                        value="Auto-generated"
                                        disabled
                                        className="cursor-not-allowed bg-muted text-muted-foreground"
                                    />
                                </div>
                            )}
                            <Input
                                label="National ID"
                                name="national_id"
                                value={formData.national_id}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Middle Name"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                            />
                            <Input
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </section>

                    {/* --- Section: Job Info --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 text-primary">
                            Employment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Job Title"
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleChange}
                                required
                            />
                            <Select
                                label="Employment Type"
                                name="employment_type"
                                value={formData.employment_type}
                                onChange={(val: string) =>
                                    handleSelectChange("employment_type", val)
                                }
                                options={[
                                    { value: "PERMANENT", label: "Permanent" },
                                    { value: "CONTRACT", label: "Contract" },
                                    { value: "CASUAL", label: "Casual" },
                                    { value: "INTERN", label: "Intern" },
                                ]}
                                required
                            />
                            <Select
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={(val: string) => handleSelectChange("department", val)}
                                options={departments.map((d) => ({
                                    value: d.id.toString(),
                                    label: d.name,
                                }))}
                                loading={fetchingDepartments}
                                required
                            />
                            <Input
                                type="date"
                                label="Hire Date"
                                name="hire_date"
                                value={formData.hire_date}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Basic Salary (KES)"
                                name="basic_salary"
                                value={
                                    formData.basic_salary
                                        ? formData.basic_salary
                                            .toString()
                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                        : ""
                                }
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value.replace(/,/g, "")
                                    if (!isNaN(Number(value))) {
                                        setFormData((prev) => ({
                                            ...prev,
                                            basic_salary: value,
                                        }))
                                    }
                                }}
                                required
                            />
                            <Select
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={(val: string) => handleSelectChange("status", val)}
                                options={[
                                    { value: "ACTIVE", label: "Active" },
                                    { value: "ON_LEAVE", label: "On Leave" },
                                    { value: "SUSPENDED", label: "Suspended" },
                                    { value: "TERMINATED", label: "Terminated" },
                                    { value: "RESIGNED", label: "Resigned" },
                                ]}
                            />
                        </div>
                    </section>

                    {/* --- Section: Statutory Info --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 text-primary">
                            Statutory Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="KRA PIN"
                                name="kra_pin"
                                value={formData.kra_pin}
                                onChange={handleChange}
                            />
                            <Input
                                label="NSSF Number"
                                name="nssf_number"
                                value={formData.nssf_number}
                                onChange={handleChange}
                            />
                            <Input
                                label="SHA Number"
                                name="SHA_number"
                                value={formData.SHA_number}
                                onChange={handleChange}
                            />
                        </div>
                    </section>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={loading ? "cursor-not-allowed opacity-50" : ""}
                        >
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

/* --- Reusable Input + Select Components --- */
const Input = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false,
}: any) => (
    <div className="grid w-full gap-1.5">
        <Label htmlFor={name}>{label}</Label>
        <StandardInput
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
        />
    </div>
)

const Select = ({
    label,
    name,
    value,
    onChange,
    options,
    loading = false,
    required = false,
}: any) => (
    <div className="grid w-full gap-1.5">
        <Label htmlFor={name}>{label}</Label>
        <StandardSelect
            value={value}
            onValueChange={onChange}
            required={required}
            disabled={loading}
        >
            <SelectTrigger id={name}>
                <SelectValue
                    placeholder={loading ? "Loading..." : `Select ${label.toLowerCase()}`}
                />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </StandardSelect>
    </div>
)
