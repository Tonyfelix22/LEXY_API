"use client";

import { useState, useEffect } from "react";
import { auditService, InternalControl, ControlTest } from "@/services/auditService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ShieldCheck, ShieldAlert, History } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/utils/api";

export default function ControlsDashboard() {
    const [controls, setControls] = useState<InternalControl[]>([]);
    const [employees, setEmployees] = useState<{ id: number, first_name: string, last_name: string }[]>([]);
    const [selectedControl, setSelectedControl] = useState<InternalControl | null>(null);
    const [tests, setTests] = useState<ControlTest[]>([]);

    // Dialog States
    const [isAddControlOpen, setIsAddControlOpen] = useState(false);
    const [isAddTestOpen, setIsAddTestOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Form States
    const [newControl, setNewControl] = useState<Partial<InternalControl>>({ control_type: 'PREVENTIVE', frequency: 'MONTHLY' });
    const [newTest, setNewTest] = useState<Partial<ControlTest>>({ result: 'PASS' });

    useEffect(() => {
        fetchControls();
        fetchEmployees();
    }, []);

    const fetchControls = async () => {
        try {
            const data = await auditService.getControls();
            setControls(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await apiFetch("/hr/employees/");
            setEmployees(data.results || data);
        } catch (error) {
            console.error("Failed to load employees");
        }
    };

    const fetchTests = async (controlId: number) => {
        try {
            const data = await auditService.getControlTests(controlId);
            setTests(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateControl = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await auditService.createControl({
                ...newControl,
                owner: newControl.owner ? Number(newControl.owner) : undefined
            } as InternalControl);
            toast.success("Control added");
            setIsAddControlOpen(false);
            setNewControl({ control_type: 'PREVENTIVE', frequency: 'MONTHLY' });
            fetchControls();
        } catch (error: any) {
            toast.error(error.message || "Failed to add control");
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedControl) return;
        try {
            await auditService.createControlTest({
                ...newTest,
                control: selectedControl.id!,
                tester: newTest.tester ? Number(newTest.tester) : undefined
            } as ControlTest);
            toast.success("Test result logged");
            setIsAddTestOpen(false);
            setNewTest({ result: 'PASS' });
        } catch (error: any) {
            toast.error(error.message || "Failed to log test");
        }
    };

    const openHistory = (control: InternalControl) => {
        setSelectedControl(control);
        fetchTests(control.id!);
        setIsHistoryOpen(true);
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case "PASS": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Pass</Badge>;
            case "FAIL": return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Fail</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Internal Controls</h2>
                <Dialog open={isAddControlOpen} onOpenChange={setIsAddControlOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Define Control
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Define Internal Control</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateControl} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Control Name</Label>
                                <Input required value={newControl.name || ""} onChange={e => setNewControl({ ...newControl, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newControl.control_type} onValueChange={(v: any) => setNewControl({ ...newControl, control_type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                                            <SelectItem value="DETECTIVE">Detective</SelectItem>
                                            <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select value={newControl.frequency} onValueChange={(v: any) => setNewControl({ ...newControl, frequency: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DAILY">Daily</SelectItem>
                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                            <SelectItem value="ANNUALLY">Annually</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Owner</Label>
                                <Select value={String(newControl.owner || "")} onValueChange={(v) => setNewControl({ ...newControl, owner: Number(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map(e => (
                                            <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={newControl.description || ""} onChange={e => setNewControl({ ...newControl, description: e.target.value })} />
                            </div>
                            <Button type="submit" className="w-full">Save Control</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                {controls.map(control => (
                    <Card key={control.id} className="flex flex-row items-center justify-between p-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{control.name}</h3>
                                <Badge variant="secondary">{control.control_type}</Badge>
                                <Badge variant="outline">{control.frequency}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{control.description}</p>
                            <p className="text-xs text-muted-foreground">Owner: {control.owner_name || "Unassigned"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isAddTestOpen && selectedControl?.id === control.id} onOpenChange={(open) => {
                                setIsAddTestOpen(open);
                                if (open) setSelectedControl(control);
                            }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Log Test
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Log Test Result: {selectedControl?.name}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateTest} className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Test Date</Label>
                                                <Input type="date" required value={newTest.test_date || ""} onChange={e => setNewTest({ ...newTest, test_date: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Result</Label>
                                                <Select value={newTest.result} onValueChange={(v: any) => setNewTest({ ...newTest, result: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PASS">Pass</SelectItem>
                                                        <SelectItem value="FAIL">Fail</SelectItem>
                                                        <SelectItem value="PARTIAL">Partial</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tester</Label>
                                            <Select value={String(newTest.tester || "")} onValueChange={(v) => setNewTest({ ...newTest, tester: Number(v) })}>
                                                <SelectTrigger><SelectValue placeholder="Select Tester" /></SelectTrigger>
                                                <SelectContent>
                                                    {employees.map(e => (
                                                        <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Notes/Evidence</Label>
                                            <Textarea value={newTest.notes || ""} onChange={e => setNewTest({ ...newTest, notes: e.target.value })} />
                                        </div>
                                        <Button type="submit" className="w-full">Submit Result</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Button variant="ghost" size="sm" onClick={() => openHistory(control)}>
                                <History className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {controls.length === 0 && <div className="text-center py-8 text-muted-foreground">No internal controls defined.</div>}
            </div>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Test History: {selectedControl?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Tester</th>
                                    <th className="py-2">Result</th>
                                    <th className="py-2">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => (
                                    <tr key={test.id} className="border-b">
                                        <td className="py-3">{format(new Date(test.test_date), "MMM d, yyyy")}</td>
                                        <td className="py-3">{test.tester_name || "-"}</td>
                                        <td className="py-3">{getResultBadge(test.result)}</td>
                                        <td className="py-3 text-muted-foreground">{test.notes}</td>
                                    </tr>
                                ))}
                                {tests.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">No test history available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
