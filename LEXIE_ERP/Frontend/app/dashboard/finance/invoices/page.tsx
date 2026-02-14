"use client";

import { useState, useEffect } from "react";
import { invoiceService, Invoice } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const data = await invoiceService.getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-green-500";
            case "POSTED": return "bg-blue-500";
            case "DRAFT": return "bg-gray-500";
            case "CANCELLED": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Invoices & Bills</h1>
                <Link href="/dashboard/finance/invoices/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reference</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Due</th>
                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{inv.reference || "-"}</td>
                                        <td className="p-4 align-middle">
                                            {inv.type === 'INVOICE' ? 'Customer Invoice' : 'Vendor Bill'}
                                        </td>
                                        <td className="p-4 align-middle">{inv.contact_name}</td>
                                        <td className="p-4 align-middle">{format(new Date(inv.date), "MMM d, yyyy")}</td>
                                        <td className="p-4 align-middle">
                                            <Badge className={getStatusColor(inv.status)}>
                                                {inv.status_display || inv.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">{Number(inv.total_amount).toLocaleString()}</td>
                                        <td className="p-4 align-middle text-right font-bold text-red-500">
                                            {Number(inv.amount_due).toLocaleString()}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
