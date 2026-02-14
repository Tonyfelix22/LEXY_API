"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import toast from "react-hot-toast"
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
import { Textarea } from "@/components/ui/textarea"

interface Department {
    id: number
    name: string
    code: string
    description?: string
    manager?: number
    manager_name?: string
    employee_count?: number
}

interface DepartmentModalProps {
    department: Department | null
    onClose: () => void
    onSave: (data: any) => Promise<void> | void
}

export default function DepartmentModal({
    department,
    onClose,
    onSave,
}: DepartmentModalProps) {
    const { user } = useAuth()
    const role = user?.groups?.[0]?.toUpperCase() || "USER"
    const isHR = role.includes("HR")
    const isAdmin = role.includes("ADMIN")

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        manager_name: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name || "",
                code: department.code || "",
                description: department.description || "",
                manager_name: department.manager_name || "",
            })
        } else {
            setFormData({
                name: "",
                code: "",
                description: "",
                manager_name: "",
            })
        }
    }, [department])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isHR && !isAdmin) {
            toast.error("You are not authorized to modify departments.")
            return
        }

        setIsSubmitting(true)
        try {
            await onSave(formData)
            toast.success(
                `Department ${department ? "updated" : "created"} successfully`
            )
            onClose()
        } catch (err) {
            console.error(err)
            toast.error("An error occurred while saving the department")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {department ? "Edit Department" : "Add Department"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Department Name */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="name">Department Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isHR && !isAdmin}
                            placeholder="Enter department name"
                            required
                        />
                    </div>

                    {/* Department Code */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="code">Department Code</Label>
                        <Input
                            id="code"
                            name="code"
                            type="text"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={!isHR && !isAdmin}
                            placeholder="Enter department code"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            disabled={!isHR && !isAdmin}
                            placeholder="Describe the department's purpose"
                            rows={4}
                        />
                    </div>

                    {/* Manager (optional, shown only to Admins) */}
                    {isAdmin && (
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="manager_name">Manager Name</Label>
                            <Input
                                id="manager_name"
                                name="manager_name"
                                type="text"
                                value={formData.manager_name}
                                onChange={handleChange}
                                placeholder="Enter manager name"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || (!isHR && !isAdmin)}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
