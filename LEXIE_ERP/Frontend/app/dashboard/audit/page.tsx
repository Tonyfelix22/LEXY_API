"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import AuditLogTable from "@/components/audit/audit-log-table"
import AuditTimeline from "@/components/audit/audit-timeline"
import ComplianceDashboard from "@/components/audit/compliance-dashboard"
import ControlsDashboard from "@/components/audit/controls-dashboard"
import { apiFetch } from "@/utils/api"
import { Search } from "lucide-react"

interface AuditLog {
    id: number
    timestamp: string
    user: string
    action: string
    model: string
    object_id: number
    changes: string
    description?: string
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filterAction, setFilterAction] = useState("")
    const [filterModel, setFilterModel] = useState("")

    // 🧠 Debounce filter changes to prevent request spamming
    const debounce = (func: Function, delay: number) => {
        let timer: NodeJS.Timeout
        return (...args: any[]) => {
            clearTimeout(timer)
            timer = setTimeout(() => func(...args), delay)
        }
    }

    const fetchLogs = useCallback(
        debounce(async (page: number, action: string, model: string) => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams({ page: page.toString() })
                if (action) params.append("action", action)
                if (model) params.append("model", model)

                const data = await apiFetch(`/audit/auditlogs/?${params.toString()}`)

                const logsData = data?.results || data?.logs || data
                setLogs(Array.isArray(logsData) ? logsData : [])

                if (data?.count) {
                    setTotalPages(Math.ceil(data.count / 10))
                } else if (Array.isArray(logsData)) {
                    setTotalPages(1)
                }
            } catch (error: any) {
                console.error("Failed to fetch audit logs:", error)
                toast.error("Failed to fetch audit logs")
                setLogs([])
            } finally {
                setIsLoading(false)
            }
        }, 300),
        []
    )

    // Trigger fetch when filters or pagination change
    useEffect(() => {
        fetchLogs(page, filterAction, filterModel)
    }, [page, filterAction, filterModel, fetchLogs])

    const resetFilters = () => {
        setFilterAction("")
        setFilterModel("")
        setPage(1)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Audit & Compliance</h1>

            <Tabs defaultValue="logs" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="logs">Audit Logs</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="controls">Internal Controls</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">System Audit Trail</h2>
                            <p className="text-muted-foreground mt-1">
                                Track all database operations and changes across HR, Finance, and Audit modules.
                            </p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                placeholder="Search..."
                                className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Timeline */}
                        <div className="lg:col-span-1">
                            <AuditTimeline logs={logs} />
                        </div>

                        {/* Right Column: All Operations Table */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                                <select
                                    value={filterModel}
                                    onChange={(e) => {
                                        setFilterModel(e.target.value)
                                        setPage(1)
                                    }}
                                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Table Affected</option>
                                    <option value="Employee">Employee</option>
                                    <option value="Department">Department</option>
                                    <option value="Account">Account</option>
                                    <option value="JournalEntry">Journal Entry</option>
                                    <option value="PayrollRun">Payroll Run</option>
                                </select>

                                <select
                                    value={filterAction}
                                    onChange={(e) => {
                                        setFilterAction(e.target.value)
                                        setPage(1)
                                    }}
                                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Operation Type</option>
                                    <option value="create">Create</option>
                                    <option value="update">Update</option>
                                    <option value="delete">Delete</option>
                                </select>

                                <button
                                    onClick={resetFilters}
                                    className="ml-auto text-sm text-primary hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>

                            <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-border/50">
                                    <h2 className="text-xl font-bold text-foreground">All Operations</h2>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <>
                                        <AuditLogTable logs={logs} />

                                        {logs.length > 0 && (
                                            <div className="flex items-center justify-between p-4 border-t border-border/50">
                                                <button
                                                    onClick={() => setPage(Math.max(1, page - 1))}
                                                    disabled={page === 1}
                                                    className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm text-muted-foreground">
                                                    Page {page} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                    disabled={page === totalPages}
                                                    className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="compliance">
                    <ComplianceDashboard />
                </TabsContent>

                <TabsContent value="controls">
                    <ControlsDashboard />
                </TabsContent>
            </Tabs>
        </div>
    )
}

