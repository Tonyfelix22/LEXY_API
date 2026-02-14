"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { leaveService, LeaveBalance, LeaveRequest } from "@/services/leaveService";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function LeaveDashboard() {
    const { user, isHRAdmin } = useAuth();
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isApplyOpen, setIsApplyOpen] = useState(false);

    // Form state
    const [selectedType, setSelectedType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [filterStatus, setFilterStatus] = useState("PENDING");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balancesData, requestsData, typesData] = await Promise.all([
                leaveService.getMyBalances(),
                leaveService.getMyRequests(),
                leaveService.getLeaveTypes(),
            ]);
            setBalances(balancesData);
            setRequests(requestsData);
            setLeaveTypes(typesData);
        } catch (error) {
            console.error("Failed to fetch leave data", error);
            toast.error("Failed to load leave data");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await leaveService.applyForLeave({
                leave_type: parseInt(selectedType),
                start_date: startDate,
                end_date: endDate,
                reason: reason,
            });

            toast.success("Leave request submitted successfully");
            setIsApplyOpen(false);
            fetchData();
            setSelectedType("");
            setStartDate("");
            setEndDate("");
            setReason("");
        } catch (error) {
            console.error("Failed to apply for leave", error);
            toast.error("Failed to submit leave request");
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await leaveService.approveRequest(id);
            toast.success("Request approved");
            fetchData();
        } catch (error) {
            toast.error("Failed to approve request");
        }
    }

    const handleReject = async (id: number) => {
        try {
            await leaveService.rejectRequest(id);
            toast.success("Request rejected");
            fetchData();
        } catch (error) {
            toast.error("Failed to reject request");
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-900/30 text-green-400 border border-green-900/50">Approved</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-900/30 text-red-400 border border-red-900/50">Rejected</Badge>;
            case "PENDING":
                return <Badge className="bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">Pending</Badge>;
            default:
                return <Badge className="bg-slate-700/50 text-slate-400 border border-slate-700">{status}</Badge>;
        }
    };

    if (loading) {
        return <div className="p-8 text-sky-400 animate-pulse font-bold uppercase tracking-widest text-center">Loading leave data...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-900 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Leave Management</h2>
                <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-lg shadow-sky-500/20">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Apply for Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="text-white">Apply for Leave</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Submit a new leave request. Your manager will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleApply} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="leave-type" className="text-sky-400">Leave Type</Label>
                                <Select onValueChange={setSelectedType} value={selectedType}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {leaveTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()} className="focus:bg-slate-700 focus:text-sky-400">
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-sky-400">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-sky-400">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-sky-400">Reason</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please provide a reason for your leave..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold">Submit Request</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {balances.map((balance) => (
                    <Card key={balance.id} className="bg-slate-800 border-slate-700 rounded-xl shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                {balance.leave_type_name}
                            </CardTitle>
                            <Clock className="h-4 w-4 text-sky-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{balance.balance} Days</div>
                            <p className="text-xs text-slate-400">
                                Used: {balance.used} days
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList className="bg-slate-800 border border-slate-700">
                    <TabsTrigger value="history" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-slate-400">My Leave History</TabsTrigger>
                    {isHRAdmin && <TabsTrigger value="approvals" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-slate-400">Pending Approvals</TabsTrigger>}
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Request History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-slate-400">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b border-slate-700 transition-colors hover:bg-slate-700/50 data-[state=selected]:bg-slate-700">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Type</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Dates</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Duration</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Reason</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {requests.filter(r => r.employee_user_id === user?.id).map((request) => (
                                            <tr key={request.id} className="border-b border-slate-700 transition-colors hover:bg-slate-700/50">
                                                <td className="p-4 align-middle font-medium text-white">{request.leave_type_name}</td>
                                                <td className="p-4 align-middle">
                                                    {format(new Date(request.start_date), "MMM d, yyyy")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                                                </td>
                                                <td className="p-4 align-middle">{request.duration} days</td>
                                                <td className="p-4 align-middle">{request.reason}</td>
                                                <td className="p-4 align-middle">{getStatusBadge(request.status)}</td>
                                            </tr>
                                        ))}
                                        {requests.filter(r => r.employee_user_id === user?.id).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-slate-500">No leave requests found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isHRAdmin && (
                    <TabsContent value="approvals" className="space-y-4">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-white">Leave Management</CardTitle>
                                <div className="flex gap-2">
                                    <Select
                                        defaultValue="PENDING"
                                        onValueChange={(val) => setFilterStatus(val)}
                                    >
                                        <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                                            <SelectValue placeholder="Filter by Status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            <SelectItem value="ALL" className="focus:bg-slate-700 focus:text-sky-400">All Requests</SelectItem>
                                            <SelectItem value="PENDING" className="focus:bg-slate-700 focus:text-sky-400">Pending Only</SelectItem>
                                            <SelectItem value="APPROVED" className="focus:bg-slate-700 focus:text-sky-400">Approved History</SelectItem>
                                            <SelectItem value="REJECTED" className="focus:bg-slate-700 focus:text-sky-400">Rejected History</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm text-slate-400">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b border-slate-700 transition-colors hover:bg-slate-700/50 data-[state=selected]:bg-slate-700">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Employee</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Type</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Dates</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Duration</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Status</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-sky-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {requests
                                                .filter(r => filterStatus === 'ALL' || r.status === filterStatus)
                                                .map((request) => (
                                                    <tr key={request.id} className="border-b border-slate-700 transition-colors hover:bg-slate-700/50">
                                                        <td className="p-4 align-middle font-medium text-white">{request.employee_name}</td>
                                                        <td className="p-4 align-middle">{request.leave_type_name}</td>
                                                        <td className="p-4 align-middle">
                                                            {format(new Date(request.start_date), "MMM d")} - {format(new Date(request.end_date), "MMM d")}
                                                        </td>
                                                        <td className="p-4 align-middle">{request.duration} days</td>
                                                        <td className="p-4 align-middle">{getStatusBadge(request.status)}</td>
                                                        <td className="p-4 align-middle">
                                                            {request.status === 'PENDING' && (
                                                                <div className="flex space-x-2">
                                                                    <Button size="sm" variant="default" className="bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900/50" onClick={() => handleApprove(request.id)}>
                                                                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                                                                    </Button>
                                                                    <Button size="sm" variant="destructive" className="bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50" onClick={() => handleReject(request.id)}>
                                                                        <XCircle className="mr-1 h-4 w-4" /> Reject
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {request.status !== 'PENDING' && (
                                                                <span className="text-slate-500 text-xs">
                                                                    {request.status === 'APPROVED' ? `Approved by ${request.approved_by_name || 'HR'}` : 'Rejected'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus).length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-4 text-center text-slate-500">No pending items.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
