"use client";

import { useState, useEffect } from "react";
import { auditService, RegulatoryRequirement } from "@/services/auditService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ComplianceDashboard() {
    const [requirements, setRequirements] = useState<RegulatoryRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newReq, setNewReq] = useState<Partial<RegulatoryRequirement>>({ status: 'PENDING' });

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        try {
            const data = await auditService.getRequirements();
            setRequirements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await auditService.createRequirement(newReq as RegulatoryRequirement);
            toast.success("Requirement added");
            setIsAddOpen(false);
            setNewReq({ status: 'PENDING' });
            fetchRequirements();
        } catch (error: any) {
            toast.error(error.message || "Failed to add requirement");
        }
    };

    const handleStatusChange = async (id: number, status: any) => {
        try {
            await auditService.updateRequirement(id, { status });
            toast.success("Status updated");
            fetchRequirements();
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLIANT": return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "NON_COMPLIANT": return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLIANT": return "bg-green-100 text-green-800 hover:bg-green-200";
            case "NON_COMPLIANT": return "bg-red-100 text-red-800 hover:bg-red-200";
            default: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Regulatory Compliance</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Requirement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Regulatory Requirement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Authority</Label>
                                <Input placeholder="e.g. IRS, GDPR" required value={newReq.authority || ""} onChange={e => setNewReq({ ...newReq, authority: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Requirement Name</Label>
                                <Input placeholder="e.g. Data Retention Policy" required value={newReq.name || ""} onChange={e => setNewReq({ ...newReq, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={newReq.due_date || ""} onChange={e => setNewReq({ ...newReq, due_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={newReq.description || ""} onChange={e => setNewReq({ ...newReq, description: e.target.value })} />
                            </div>
                            <Button type="submit" className="w-full">Save Requirement</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requirements.map(req => (
                    <Card key={req.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline">{req.authority}</Badge>
                                {getStatusIcon(req.status)}
                            </div>
                            <CardTitle className="mt-2 text-lg">{req.name}</CardTitle>
                            {req.due_date && <CardDescription>Due: {format(new Date(req.due_date), "MMM d, yyyy")}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{req.description}</p>
                            <Select
                                value={req.status}
                                onValueChange={(v) => handleStatusChange(req.id!, v)}
                            >
                                <SelectTrigger className={`h-8 w-full ${getStatusColor(req.status)} border-0`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="COMPLIANT">Compliant</SelectItem>
                                    <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {requirements.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground">No compliance requirements tracked.</div>}
        </div>
    );
}
