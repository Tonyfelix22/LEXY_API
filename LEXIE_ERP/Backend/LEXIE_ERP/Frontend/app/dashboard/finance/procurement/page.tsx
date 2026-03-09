"use client"

import { useEffect, useState } from "react"
import { purchaseService, PurchaseRequest } from "@/services/purchaseService"
import { CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function ProcurementPage() {
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const data = await purchaseService.getAll()
            setRequests(data)
        } catch (error) {
            console.error("Failed to fetch purchase requests:", error)
            toast.error("Failed to load purchase requests")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleApprove = async (id: number) => {
        if (!confirm("Approve this purchase request? This will deduct from the allocated budget.")) return
        try {
            await purchaseService.approve(id)
            toast.success("Request Approved")
            fetchRequests()
        } catch (error) {
            toast.error("Failed to approve request")
        }
    }

    const handleReject = async (id: number) => {
        const reason = prompt("Enter rejection reason:")
        if (!reason) return

        try {
            await purchaseService.reject(id, reason)
            toast.success("Request Rejected")
            fetchRequests()
        } catch (error) {
            toast.error("Failed to reject request")
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Procurement & Approvals</h1>
                <p className="text-gray-500 mt-2">Manage purchase requests and approvals.</p>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item/Description</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No purchase requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{req.requester_name}</td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={req.description}>{req.description}</td>
                                        <td className="px-6 py-4 text-gray-600">{req.department_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{Number(req.estimated_cost).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{req.budget_name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="text-gray-400 hover:text-green-600 transition-colors mr-3"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
