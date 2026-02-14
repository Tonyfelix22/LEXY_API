'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import TravelModal from '@/components/hr/travel-modal'
import TravelTable from '@/components/hr/travel-table'
import { travelService, TravelRequest } from '@/services/travelService'

export default function TravelPage() {
    const [requests, setRequests] = useState<TravelRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const data = await travelService.getMyRequests()
            setRequests(data)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load travel requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleCreate = () => {
        setSelectedRequest(null)
        setIsModalOpen(true)
    }

    const handleEdit = (request: TravelRequest) => {
        if (request.status !== 'PENDING') {
            toast.error('Only pending requests can be edited')
            return
        }
        setSelectedRequest(request)
        setIsModalOpen(true)
    }

    const handleSave = async (data: any) => {
        try {
            if (data.id) {
                // Update logic if API supports it (omitted in service but usually implies PUT/PATCH)
                // Assuming create for now, or add update to service later.
                // For this demo, let's assume create works or add notification.
                toast.error("Update feature not fully implemented in service yet")
            } else {
                await travelService.createRequest(data)
                toast.success('Travel request submitted')
            }
            fetchRequests()
            setIsModalOpen(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to save request')
        }
    }

    // Since we don't have a delete endpoint exposed in service yet, we'll skip delete action or implement it.

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Travel Requests</h1>
                    <p className="text-gray-500">Manage your business travel applications</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Request
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading requests...</div>
            ) : (
                <TravelTable
                    requests={requests}
                    onEdit={handleEdit}
                    isManager={false} // Default to employee view
                />
            )}

            <TravelModal
                isOpen={isModalOpen}
                request={selectedRequest}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}
