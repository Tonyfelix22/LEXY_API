"use client"

import React, { useState, useEffect } from "react"
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

interface JournalEntry {
    id: number
    date: string
    description: string
    reference?: string | null
    created_at?: string
}

interface JournalEntryModalProps {
    entry: JournalEntry | null
    onClose: () => void
    onSave: (data: Omit<JournalEntry, "id" | "created_at">) => void
}

export default function JournalEntryModal({
    entry,
    onClose,
    onSave,
}: JournalEntryModalProps) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        reference: "",
        description: "",
    })

    useEffect(() => {
        if (entry) {
            setFormData({
                date: entry.date || new Date().toISOString().split("T")[0],
                reference: entry.reference || "",
                description: entry.description || "",
            })
        }
    }, [entry])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.description.trim()) {
            alert("Description is required.") // Ideally use a Toast here, but keeping alert for now as per original logic or upgrade later
            return
        }
        onSave({
            date: formData.date,
            reference: formData.reference || null,
            description: formData.description,
        })
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {entry ? "Edit Journal Entry" : "Add Journal Entry"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Date */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Reference (optional) */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="reference">Reference (optional)</Label>
                        <Input
                            id="reference"
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleChange}
                            placeholder="e.g., INV-2025-001"
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
                            placeholder="Enter journal entry description..."
                            rows={4}
                            required
                        />
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
