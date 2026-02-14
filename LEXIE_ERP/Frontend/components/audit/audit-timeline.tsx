"use client"

import { User, FileText, DollarSign, Settings, ShieldAlert } from "lucide-react"

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

interface AuditTimelineProps {
    logs: AuditLog[]
}

export default function AuditTimeline({ logs }: AuditTimelineProps) {
    // Take only the first 5-6 logs for the timeline
    const timelineLogs = logs.slice(0, 6)

    const getIcon = (model: string, action: string) => {
        const m = (model || "").toLowerCase()
        const a = (action || "").toLowerCase()

        if (m.includes("employee") || m.includes("user")) return <User className="h-4 w-4 text-blue-500" />
        if (m.includes("finance") || m.includes("account") || m.includes("payroll")) return <DollarSign className="h-4 w-4 text-green-500" />
        if (m.includes("audit")) return <FileText className="h-4 w-4 text-purple-500" />
        if (m.includes("config") || m.includes("setting")) return <Settings className="h-4 w-4 text-gray-500" />

        return <ShieldAlert className="h-4 w-4 text-orange-500" />
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
            })
        } catch (e) {
            return dateString
        }
    }

    return (
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm h-full">
            <h2 className="text-xl font-bold text-foreground mb-6">Timeline of Key Changes</h2>
            <div className="relative border-l-2 border-border ml-3 space-y-8">
                {timelineLogs.map((log, index) => (
                    <div key={log.id} className="mb-8 ml-6 relative">
                        <span className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border ring-4 ring-background">
                            {getIcon(log.model, log.action)}
                        </span>
                        <div className="flex flex-col">
                            <h3 className="text-base font-semibold text-foreground">
                                {(log.action || "").replace(/_/g, ' ')}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-1">
                                {log.model || "Unknown"} ID: {log.object_id}
                            </p>
                            <time className="text-xs text-muted-foreground">
                                {formatDate(log.timestamp)}
                            </time>
                        </div>
                    </div>
                ))}
                {timelineLogs.length === 0 && (
                    <div className="ml-6 text-muted-foreground">No recent activity.</div>
                )}
            </div>
        </div>
    )
}
