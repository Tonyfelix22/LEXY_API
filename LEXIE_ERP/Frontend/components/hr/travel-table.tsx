import { TravelRequest } from "@/services/travelService";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface TravelTableProps {
    requests: TravelRequest[];
    onEdit?: (request: TravelRequest) => void;
    onDelete?: (id: number) => void;
    onApprove?: (request: TravelRequest) => void;
    onReject?: (request: TravelRequest) => void;
    showActions?: boolean;
    isManager?: boolean;
}

export default function TravelTable({
    requests,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    showActions = true,
    isManager = false
}: TravelTableProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        {showActions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                No travel requests found.
                            </td>
                        </tr>
                    ) : (
                        requests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {request.employee_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {request.destination}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {request.start_date} to {request.end_date}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.purpose}>
                                    {request.purpose}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {parseFloat(request.estimated_cost).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                        {request.status}
                                    </span>
                                </td>
                                {showActions && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {isManager && request.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => onApprove?.(request)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onReject?.(request)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Reject"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {(!isManager || request.status === 'PENDING') && (
                                            <button
                                                onClick={() => onEdit?.(request)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
