"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { invoiceService, Invoice } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, CreditCard, Printer } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvoiceDetailClient() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    // Payment Dialog State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState("BANK");
    const [payRef, setPayRef] = useState("");

    useEffect(() => {
        if (params.id) fetchInvoice(Number(params.id));
    }, [params.id, fetchInvoice]);

    const fetchInvoice = useCallback(async (id: number) => {
        try {
            const data = await invoiceService.getInvoice(id);
            setInvoice(data);
            setPayAmount(String(data.amount_due)); // Default to paying full amount
        } catch (error) {
            console.error(error);
            toast.error("Failed to load invoice");
            router.push("/dashboard/finance/invoices");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handlePost = async () => {
        if (!invoice) return;
        try {
            await invoiceService.postInvoice(invoice.id!);
            toast.success("Invoice posted successfully");
            fetchInvoice(invoice.id!);
        } catch (error: any) {
            toast.error(error.message || "Failed to post invoice");
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;
        try {
            await invoiceService.registerPayment(invoice.id!, {
                amount: parseFloat(payAmount),
                method: payMethod,
                reference: payRef
            });
            toast.success("Payment registered");
            setIsPaymentOpen(false);
            fetchInvoice(invoice.id!);
        } catch (error: any) {
            toast.error(error.message || "Payment registration failed");
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

    if (loading) return <div className="p-8">Loading...</div>;
    if (!invoice) return <div className="p-8">Invoice not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/finance/invoices">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {invoice.type === 'INVOICE' ? 'Invoice' : 'Bill'} {invoice.reference}
                    </h1>
                    <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status_display}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    {invoice.status === 'DRAFT' && (
                        <Button onClick={handlePost} className="bg-blue-600 hover:bg-blue-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Post
                        </Button>
                    )}
                    {(invoice.status === 'POSTED' || (invoice.status === 'PAID' && (invoice.amount_due || 0) > 0)) && (
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <CreditCard className="mr-2 h-4 w-4" /> Register Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Register Payment</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handlePayment} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={payAmount}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Select value={payMethod} onValueChange={setPayMethod}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="CHECK">Check</SelectItem>
                                                <SelectItem value="MOBILE">Mobile Money</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reference</Label>
                                        <Input
                                            value={payRef}
                                            onChange={(e) => setPayRef(e.target.value)}
                                            placeholder="Check No, Trans ID..."
                                        />
                                    </div>
                                    <Button type="submit" className="w-full">Confirm Payment</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Customer/Vendor</p>
                                <p className="text-lg font-semibold">{invoice.contact_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Date</p>
                                <p className="text-lg">{format(new Date(invoice.date), "PPP")}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                                <p className="text-lg">{format(new Date(invoice.due_date), "PPP")}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Journal Entry</p>
                                <p className="text-lg text-blue-500 cursor-pointer">#{invoice.journal_entry || "N/A"}</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-semibold mb-4">Invoice Items</h3>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Description</th>
                                        <th className="text-left py-2">Account</th>
                                        <th className="text-right py-2">Qty</th>
                                        <th className="text-right py-2">Unit Price</th>
                                        <th className="text-right py-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-2">{item.description}</td>
                                            <td className="py-2 text-sm text-muted-foreground">{item.account_name}</td>
                                            <td className="py-2 text-right">{item.quantity}</td>
                                            <td className="py-2 text-right">{item.unit_price}</td>
                                            <td className="py-2 text-right font-medium">{item.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-12 border-t pt-6">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold">{Number(invoice.total_amount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Amount Due</p>
                            <p className="text-2xl font-bold text-red-500">{Number(invoice.amount_due).toLocaleString()}</p>
                        </div>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-2 bg-gray-200"></div>
                                <div>
                                    <p className="text-sm font-medium">Created</p>
                                    <p className="text-xs text-muted-foreground">Invoice created in Draft</p>
                                </div>
                            </div>
                            {invoice.status !== 'DRAFT' && (
                                <div className="flex gap-4">
                                    <div className="w-2 bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-medium">Posted</p>
                                        <p className="text-xs text-muted-foreground">Journal Entry #{invoice.journal_entry} created</p>
                                    </div>
                                </div>
                            )}
                            {invoice.status === 'PAID' && (
                                <div className="flex gap-4">
                                    <div className="w-2 bg-green-500"></div>
                                    <div>
                                        <p className="text-sm font-medium">Paid</p>
                                        <p className="text-xs text-muted-foreground">Full payment received</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
