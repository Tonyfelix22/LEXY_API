"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { bankService, BankStatement, BankStatementLine } from "@/services/bankService";
import { apiFetch } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Plus, Link as LinkIcon, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Types for Unreconciled Journal Entries
interface UnreconciledEntry {
    id: number;
    date: string;
    description: string;
    reference: string;
    total_debit?: number;
    total_credit?: number;
    amount_signed: number; // Computed helper
}

export default function ReconciliationPage() {
    const params = useParams();
    const router = useRouter();
    const [statement, setStatement] = useState<BankStatement | null>(null);
    const [lines, setLines] = useState<BankStatementLine[]>([]);
    const [journals, setJournals] = useState<UnreconciledEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // New Line State
    const [newLineOpen, setNewLineOpen] = useState(false);
    const [newLine, setNewLine] = useState<Partial<BankStatementLine>>({ date: new Date().toISOString().split('T')[0] });

    // Match Dialog State
    const [matchDialogOpen, setMatchDialogOpen] = useState(false);
    const [selectedLineForMatch, setSelectedLineForMatch] = useState<BankStatementLine | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (params.id) {
            fetchData(Number(params.id));
        }
    }, [params.id]);

    const fetchData = async (id: number) => {
        try {
            const stmt = await bankService.getStatement(id);
            setStatement(stmt);
            setLines(stmt.lines || []);

            // Fetch All Journals
            const jData = await apiFetch("/finance/journals/");
            const allJournals = jData.results || jData;

            setJournals(allJournals.map((j: any) => ({
                id: j.id,
                date: j.date,
                description: j.description,
                reference: j.reference,
                amount_signed: 0
            })));

        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await bankService.createLine({
                ...newLine,
                statement: statement!.id!,
                amount: parseFloat(String(newLine.amount)),
                is_reconciled: false
            } as BankStatementLine);
            toast.success("Line added");
            setNewLineOpen(false);
            setNewLine({ date: new Date().toISOString().split('T')[0] });
            fetchData(statement!.id!);
        } catch (error: any) {
            toast.error("Failed to add line");
        }
    };

    const openMatchDialog = (line: BankStatementLine) => {
        setSelectedLineForMatch(line);
        setMatchDialogOpen(true);
        setSearchTerm("");
    };

    const handleMatch = async (journalId: number) => {
        if (!selectedLineForMatch) return;
        try {
            await bankService.matchLine(selectedLineForMatch.id!, journalId);
            toast.success("Matched successfully");
            setMatchDialogOpen(false);
            setSelectedLineForMatch(null);
            fetchData(statement!.id!);
        } catch (error: any) {
            toast.error(error.message || "Match failed");
        }
    };

    const handleUnmatch = async (lineId: number) => {
        try {
            await bankService.unmatchLine(lineId);
            toast.success("Unmatched successfully");
            fetchData(statement!.id!);
        } catch (error: any) {
            toast.error("Unmatch failed");
        }
    };

    // Filter Journals for Dialog
    const filteredJournals = journals.filter(j =>
        j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(j.id).includes(searchTerm)
    );

    if (loading) return <div className="p-8">Loading reconciliation...</div>;
    if (!statement) return <div className="p-8">Statement not found</div>;

    const reconciledCount = lines.filter(l => l.is_reconciled).length;
    const progress = Math.round((reconciledCount / lines.length) * 100) || 0;

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/finance/bank-reconciliation">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reconciliation: {statement.reference}</h1>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(statement.statement_date), "MMM d, yyyy")} &bull;
                            Target: KES {Number(statement.end_balance).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="font-bold">{progress}% ({reconciledCount}/{lines.length})</p>
                    </div>
                    <Dialog open={newLineOpen} onOpenChange={setNewLineOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Line
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Bank Statement Line</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateLine} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" required value={newLine.date} onChange={e => setNewLine({ ...newLine, date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input required value={newLine.description || ""} onChange={e => setNewLine({ ...newLine, description: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input type="number" step="0.01" required value={newLine.amount || ""} onChange={e => setNewLine({ ...newLine, amount: e.target.value })} />
                                    <p className="text-xs text-muted-foreground">Positive for Deposit/Credit, Negative for Withdrawal/Debit.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Reference</Label>
                                    <Input value={newLine.reference || ""} onChange={e => setNewLine({ ...newLine, reference: e.target.value })} />
                                </div>
                                <Button type="submit" className="w-full">Add Line</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Content Area - Split View */}
            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                {/* Left: Bank Lines */}
                <Card className="flex flex-col min-h-0 border-l-4 border-l-blue-500">
                    <CardHeader className="py-3 border-b bg-muted/40 shrink-0">
                        <CardTitle className="text-lg">Bank Options</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1">
                        <div className="divide-y">
                            {lines.map(line => (
                                <div key={line.id} className={`p-3 flex items-center justify-between hover:bg-muted/30 transition-colors ${line.matched_journal_entry ? "bg-green-50/50" : ""}`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium">{format(new Date(line.date), "MMM d")}</span>
                                            <span className="font-medium text-foreground">{line.description}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${Number(line.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {Number(line.amount) >= 0 ? "+" : ""}{Number(line.amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {line.matched_journal_entry ? (
                                            <Button variant="ghost" size="sm" onClick={() => handleUnmatch(line.id!)} className="text-green-600 hover:text-red-600 hover:bg-red-50">
                                                <CheckCircle className="h-4 w-4 mr-1" /> Linked
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => openMatchDialog(line)}>
                                                <LinkIcon className="h-3 w-3 mr-2" /> Match
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {lines.length === 0 && <div className="p-8 text-center text-muted-foreground">No lines. Add or Import lines.</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: System Journals Info */}
                <Card className="flex flex-col min-h-0 border-l-4 border-l-purple-500 col-span-1 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Reconciliation Workflow</h3>
                        <p className="max-w-xs">
                            Select a Bank Line on the left and click <strong>Match</strong> to link it to a System Journal Entry.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Match Dialog */}
            <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Find Match for {selectedLineForMatch?.description}</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Match bank line amount: <strong>KES {Number(selectedLineForMatch?.amount).toLocaleString()}</strong>
                        </p>
                    </DialogHeader>

                    <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search journal entries..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border rounded-md">
                        <div className="divide-y">
                            {filteredJournals.map(journal => (
                                <div key={journal.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                                    <div className="space-y-1">
                                        <p className="font-medium">{journal.description}</p>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>{journal.reference}</span>
                                            <span>&bull;</span>
                                            <span>{format(new Date(journal.date), "MMM d")}</span>
                                            <span>&bull;</span>
                                            <span>ID: {journal.id}</span>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleMatch(journal.id)}>Select</Button>
                                </div>
                            ))}
                            {filteredJournals.length === 0 && <div className="p-4 text-center text-muted-foreground">No matching journals found.</div>}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
