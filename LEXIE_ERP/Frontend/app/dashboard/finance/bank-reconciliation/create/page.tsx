"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bankService } from "@/services/bankService";
import { apiFetch } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function CreateStatementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: number, name: string, code: string }[]>([]);

    const [formData, setFormData] = useState({
        account: "",
        reference: "",
        statement_date: new Date().toISOString().split('T')[0],
        start_balance: "",
        end_balance: "",
        status: "DRAFT",
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // Ideally fetch only Asset/Bank accounts. Backend filters logic might vary.
                const data = await apiFetch("/finance/accounts/?type=ASSET");
                setAccounts(data.results || data);
            } catch (error) {
                console.error("Failed to load accounts");
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const statement = await bankService.createStatement({
                ...formData,
                account: parseInt(formData.account),
                start_balance: parseFloat(formData.start_balance),
                end_balance: parseFloat(formData.end_balance),
                status: formData.status as any,
            });
            toast.success("Statement created");
            router.push(`/dashboard/finance/bank-reconciliation/${statement.id}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to create statement");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/bank-reconciliation">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">New Bank Statement</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Statement Details</CardTitle>
                    <CardDescription>Enter the header information from your physical bank statement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Bank Account</Label>
                            <Select
                                value={formData.account}
                                onValueChange={(v) => setFormData({ ...formData, account: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Bank Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={String(acc.id)}>
                                            {acc.code} - {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Statement Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.statement_date}
                                    onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reference / Statement #</Label>
                                <Input
                                    placeholder="e.g. STMT-2024-01"
                                    required
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Balance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.start_balance}
                                    onChange={(e) => setFormData({ ...formData, start_balance: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Balance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.end_balance}
                                    onChange={(e) => setFormData({ ...formData, end_balance: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create & Continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
