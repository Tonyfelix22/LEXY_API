"use client"

import { useEffect, useState } from "react"
import { purchaseService, PurchaseRequest } from "@/services/purchaseService"
import { Plus, Check, Clock, X } from "lucide-react"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function EmployeeProcurementPage() {
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Form state
    const [description, setDescription] = useState("")
    const [estimatedCost, setEstimatedCost] = useState("")
    const [vendorSuggestion, setVendorSuggestion] = useState("")

    const fetchRequests = async () => {
        setLoading(true)
        try {
            // This service method should return requests for the current user
            const data = await purchaseService.getMyRequests()
            setRequests(data)
        } catch (error) {
            console.error("Failed to fetch requests:", error)
            toast.error("Failed to load purchase requests")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await purchaseService.create({
                description,
                estimated_cost: estimatedCost,
                vendor_suggestion: vendorSuggestion
                // Department is usually auto-linked or selected if manager. 
                // Creating without department might imply user's default department in backend.
            })
            toast.success("Request submitted successfully")
            setIsCreateOpen(false)
            setDescription("")
            setEstimatedCost("")
            setVendorSuggestion("")
            fetchRequests()
        } catch (error) {
            toast.error("Failed to submit request")
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Check className="w-4 h-4 text-green-500" />
            case 'REJECTED': return <X className="w-4 h-4 text-red-500" />
            default: return <Clock className="w-4 h-4 text-yellow-500" />
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Purchase Requests</h1>
                    <p className="text-gray-500 mt-2">Request items or services for your department.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Purchase Request</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    placeholder="Describe the item or service needed..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-md"
                                    value={estimatedCost}
                                    onChange={e => setEstimatedCost(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Suggestion (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-md"
                                    value={vendorSuggestion}
                                    onChange={e => setVendorSuggestion(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit">Submit Request</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid gap-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-500">No requests found. Create one to get started.</p>
                        </div>
                    ) : (
                        requests.map(request => (
                            <div key={request.id} className="bg-white p-6 rounded-lg border shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{request.description}</h3>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                        <span>Cost: {Number(request.estimated_cost).toLocaleString()}</span>
                                        <span>•</span>
                                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                        {request.department_name && (
                                            <>
                                                <span>•</span>
                                                <span>{request.department_name}</span>
                                            </>
                                        )}
                                    </div>
                                    {request.rejection_reason && (
                                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                                            Rejection Reason: {request.rejection_reason}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(request.status)}
                                    <span className={`text-sm font-medium ${request.status === 'APPROVED' ? 'text-green-600' :
                                            request.status === 'REJECTED' ? 'text-red-600' :
                                                'text-yellow-600'
                                        }`}>
                                        {request.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
