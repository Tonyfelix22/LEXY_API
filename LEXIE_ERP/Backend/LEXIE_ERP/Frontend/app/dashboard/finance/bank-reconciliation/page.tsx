"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { bankService, BankStatement } from "@/services/bankService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";

export default function BankReconciliationPage() {
    const [statements, setStatements] = useState<BankStatement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatements = async () => {
            try {
                const data = await bankService.getStatements();
                setStatements(data);
            } catch (error) {
                console.error("Failed to fetch statements", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStatements();
    }, []);

    const getStatusBadge = (status: string) => {
        return status === 'POSTED'
            ? <Badge className="bg-green-100 text-green-800">Posted</Badge>
            : <Badge variant="outline">Draft</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
                    <p className="text-muted-foreground mt-1">Manage bank statements and reconcile accounts.</p>
                </div>
                <Link href="/dashboard/finance/bank-reconciliation/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Statement
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="text-center py-10">Loading statements...</div>
                ) : statements.length === 0 ? (
                    <Card className="text-center py-16 bg-muted/20 border-dashed">
                        <CardContent>
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No Statements Found</h3>
                            <p className="text-muted-foreground mb-4">Start by creating a new bank statement.</p>
                            <Link href="/dashboard/finance/bank-reconciliation/create">
                                <Button variant="outline">Create Statement</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Statements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {statements.map((stmt) => (
                                    <div key={stmt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{stmt.reference}</h4>
                                                {getStatusBadge(stmt.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {stmt.account_name} &bull; {format(new Date(stmt.statement_date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">Balance</p>
                                                <p className="text-lg font-bold">
                                                    KES {Number(stmt.end_balance).toLocaleString()}
                                                </p>
                                            </div>
                                            <Link href={`/dashboard/finance/bank-reconciliation/${stmt.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
