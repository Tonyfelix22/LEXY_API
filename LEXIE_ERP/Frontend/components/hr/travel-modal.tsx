'use client'

import { useState, useEffect } from 'react'
import { TravelRequest } from '@/services/travelService'
import { X } from 'lucide-react'

interface TravelModalProps {
    isOpen: boolean
    request: TravelRequest | null
    onClose: () => void
    onSave: (data: any) => Promise<void>
}

export default function TravelModal({ isOpen, request, onClose, onSave }: TravelModalProps) {
    const [formData, setFormData] = useState({
        destination: '',
        start_date: '',
        end_date: '',
        purpose: '',
        estimated_cost: '',
    })

    useEffect(() => {
        if (request) {
            setFormData({
                destination: request.destination,
                start_date: request.start_date,
                end_date: request.end_date,
                purpose: request.purpose,
                estimated_cost: request.estimated_cost,
            })
        } else {
            setFormData({
                destination: '',
                start_date: '',
                end_date: '',
                purpose: '',
                estimated_cost: '',
            })
        }
    }, [request, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSave({
            ...formData,
            id: request?.id
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {request ? 'Edit Travel Request' : 'New Travel Request'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose/Reason</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={formData.estimated_cost}
                            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg"
                        >
                            {request ? 'Update Request' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
