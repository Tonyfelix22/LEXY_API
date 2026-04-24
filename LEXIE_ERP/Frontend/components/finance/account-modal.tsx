"use client"

import React, { useState, useEffect } from "react"
import { api } from "@/utils/api"
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

interface Account {
    id: number
    code: string
    name: string
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
    balance: number | string
    parent?: number | null
    parent_name?: string
}

interface AccountModalProps {
    account: Account | null
    onClose: () => void
    onSave: (data: Omit<Account, "id" | "parent_name">) => void
}

export default function AccountModal({
    account,
    onClose,
    onSave,
}: AccountModalProps) {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "",
        balance: "",
        parent: "",
    })
    const [parentAccounts, setParentAccounts] = useState<Account[]>([])

    useEffect(() => {
        if (account) {
            setFormData({
                code: account.code || "",
                name: account.name || "",
                type: account.type || "",
                balance: account.balance?.toString() || "",
                parent: account.parent ? account.parent.toString() : "",
            })
        }
        fetchParentAccounts()
    }, [account])

    const fetchParentAccounts = async () => {
        try {
            const data = await api.get("/finance/accounts/")
            setParentAccounts(data.results || data)
        } catch (error) {
            console.error("Failed to fetch parent accounts:", error)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            code: formData.code.trim(),
            name: formData.name.trim(),
            type: formData.type as Account["type"],
            balance: Number.parseFloat(formData.balance || "0"),
            parent: formData.parent ? Number(formData.parent) : null,
        }
        onSave(payload)
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Code */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="Enter account code"
                            required
                        />
                    </div>

                    {/* Name */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter account name"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="type">Account Type</Label>
                        <Select
                            name="type"
                            value={formData.type}
                            onValueChange={(value) => handleSelectChange("type", value)}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ASSET">Asset</SelectItem>
                                <SelectItem value="LIABILITY">Liability</SelectItem>
                                <SelectItem value="EQUITY">Equity</SelectItem>
                                <SelectItem value="INCOME">Income</SelectItem>
                                <SelectItem value="EXPENSE">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Balance */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="balance">Balance</Label>
                        <Input
                            id="balance"
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            placeholder="Enter balance"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Parent */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="parent">Parent Account (Optional)</Label>
                        <Select
                            name="parent"
                            value={formData.parent || "none"}
                            onValueChange={(value) => handleSelectChange("parent", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No parent account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No parent account</SelectItem>
                                {parentAccounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id.toString()}>
                                        {acc.code} - {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
