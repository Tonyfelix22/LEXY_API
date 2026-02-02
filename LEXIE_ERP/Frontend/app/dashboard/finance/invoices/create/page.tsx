"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { invoiceService, Contact } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

interface Account {
    id: number;
    name: string;
    code: string;
}

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data Sources
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Form State
    const [type, setType] = useState<'INVOICE' | 'BILL'>('INVOICE');
    const [contact, setContact] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState("");

    // Items
    const [items, setItems] = useState([
        { description: "", account: "", quantity: 1, unit_price: 0 }
    ]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [contactsData, accountsData] = await Promise.all([
                    invoiceService.getContacts(),
                    apiFetch('/finance/accounts/')
                ]);
                setContacts(contactsData);
                setAccounts(accountsData.results || accountsData);
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        loadData();
    }, []);

    const addItem = () => {
        setItems([...items, { description: "", account: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter contacts by type to match invoice type usually?
            // For now, allow any contact.

            const payload = {
                type,
                contact: Number(contact),
                reference,
                date,
                due_date: dueDate,
                items: items.map(item => ({
                    description: item.description,
                    account: Number(item.account),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            await invoiceService.createInvoice(payload);
            toast.success("Invoice created successfully");
            router.push("/dashboard/finance/invoices");
        } catch (error: any) {
            toast.error(error.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/invoices">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={(v: any) => setType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INVOICE">Customer Invoice (Sale)</SelectItem>
                                        <SelectItem value="BILL">Vendor Bill (Purchase)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Contact (Customer/Vendor)</Label>
                                <Select value={contact} onValueChange={setContact}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select contact..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name} ({c.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reference #</Label>
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="e.g. INV-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Invoice Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Line Items</h3>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                        <div className="col-span-4 space-y-2">
                                            <Label className="text-xs">Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder="Item description"
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs">Account</Label>
                                            <Select value={String(item.account)} onValueChange={(v) => updateItem(index, 'account', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map(acc => (
                                                        <SelectItem key={acc.id} value={String(acc.id)}>
                                                            {acc.code} - {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs">Unit Price</Label>
                                            <Input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-6">
                                <div className="text-right">
                                    <p className="text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">{calculateTotal().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Create Invoice'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
